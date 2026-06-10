// Microsoft Graph adapter (Outlook / Microsoft 365). Activates when MS_CLIENT_ID
// / _SECRET are set. Incremental sync via /me/events/delta (deltaLink) and push
// via /subscriptions with the validationToken handshake + clientState check.
// Reference: https://learn.microsoft.com/graph/delta-query-events
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CalendarProvider, ChangeSet, ConnectionCtx, ExternalEvent, OutboundEvent, TokenSet, WatchChannel } from "../types";

const GRAPH = "https://graph.microsoft.com/v1.0";
const AUTH = "https://login.microsoftonline.com/common/oauth2/v2.0";
const SCOPE = "offline_access Calendars.ReadWrite";

async function mfetch(ctx: ConnectionCtx, url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${ctx.accessToken}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`graph ${init.method ?? "GET"} ${res.status}: ${await res.text()}`);
  return res;
}
const toEvent = (it: any): ExternalEvent => ({
  externalId: it.id,
  etag: it["@odata.etag"] ?? "",
  summary: it.subject ?? "Busy",
  startsAt: it.start?.dateTime ? `${it.start.dateTime}Z` : "",
  endsAt: it.end?.dateTime ? `${it.end.dateTime}Z` : "",
  cancelled: Boolean(it["@removed"]) || it.isCancelled === true,
});

export class MicrosoftProvider implements CalendarProvider {
  readonly id = "microsoft" as const;
  readonly supportsPush = true;
  readonly pollIntervalSec = 0;

  getAuthUrl(state: string, redirectUri: string): string {
    const p = new URLSearchParams({ client_id: process.env.MS_CLIENT_ID!, response_type: "code", redirect_uri: redirectUri, response_mode: "query", scope: SCOPE, state });
    return `${AUTH}/authorize?${p}`;
  }
  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch(`${AUTH}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.MS_CLIENT_ID!, client_secret: process.env.MS_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code", scope: SCOPE }) });
    const j: any = await res.json();
    return { accessToken: j.access_token, refreshToken: j.refresh_token, expiresAt: new Date(Date.now() + j.expires_in * 1000).toISOString() };
  }
  async refresh(refreshToken: string): Promise<TokenSet> {
    const res = await fetch(`${AUTH}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ refresh_token: refreshToken, client_id: process.env.MS_CLIENT_ID!, client_secret: process.env.MS_CLIENT_SECRET!, grant_type: "refresh_token", scope: SCOPE }) });
    const j: any = await res.json();
    return { accessToken: j.access_token, refreshToken: j.refresh_token ?? refreshToken, expiresAt: new Date(Date.now() + j.expires_in * 1000).toISOString() };
  }

  async listChanges(ctx: ConnectionCtx): Promise<ChangeSet> {
    const events: ExternalEvent[] = [];
    let url = ctx.syncToken || `${GRAPH}/me/calendarView/delta?startDateTime=${new Date(Date.now() - 30 * 86400e3).toISOString()}&endDateTime=${new Date(Date.now() + 60 * 86400e3).toISOString()}`;
    let nextSyncToken = ctx.syncToken ?? "";
    for (;;) {
      const j: any = await (await mfetch(ctx, url, { headers: { Prefer: 'odata.maxpagesize=50, outlook.timezone="UTC"' } })).json();
      for (const it of j.value ?? []) events.push(toEvent(it));
      if (j["@odata.nextLink"]) { url = j["@odata.nextLink"]; continue; }
      nextSyncToken = j["@odata.deltaLink"] ?? nextSyncToken;
      break;
    }
    return { events, nextSyncToken };
  }
  async createEvent(ctx: ConnectionCtx, ev: OutboundEvent) {
    const j: any = await (await mfetch(ctx, `${GRAPH}/me/events`, { method: "POST", body: JSON.stringify({ subject: ev.summary, start: { dateTime: ev.startsAt, timeZone: "UTC" }, end: { dateTime: ev.endsAt, timeZone: "UTC" } }) })).json();
    return { externalId: j.id, etag: j["@odata.etag"] };
  }
  async updateEvent(ctx: ConnectionCtx, externalId: string, ev: OutboundEvent, etag?: string) {
    const j: any = await (await mfetch(ctx, `${GRAPH}/me/events/${externalId}`, { method: "PATCH", headers: etag ? { "If-Match": etag } : {}, body: JSON.stringify({ subject: ev.summary, start: { dateTime: ev.startsAt, timeZone: "UTC" }, end: { dateTime: ev.endsAt, timeZone: "UTC" } }) })).json();
    return { etag: j["@odata.etag"] };
  }
  async deleteEvent(ctx: ConnectionCtx, externalId: string) {
    await mfetch(ctx, `${GRAPH}/me/events/${externalId}`, { method: "DELETE" });
  }
  async watch(ctx: ConnectionCtx, webhookUrl: string): Promise<WatchChannel> {
    const clientState = crypto.randomUUID();
    const expiry = new Date(Date.now() + 3 * 86400e3).toISOString(); // Graph caps event subs at ~3 days
    const j: any = await (await mfetch(ctx, `${GRAPH}/subscriptions`, { method: "POST", body: JSON.stringify({ changeType: "created,updated,deleted", notificationUrl: webhookUrl, resource: "/me/events", expirationDateTime: expiry, clientState }) })).json();
    return { channelId: j.id, resourceId: j.resource ?? "/me/events", clientState, expiresAt: j.expirationDateTime ?? expiry };
  }
  async stopWatch(ctx: ConnectionCtx, channelId: string) {
    await mfetch(ctx, `${GRAPH}/subscriptions/${channelId}`, { method: "DELETE" });
  }
}
