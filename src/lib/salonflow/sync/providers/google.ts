// Google Calendar API v3 adapter. Activates when GOOGLE_CLIENT_ID / _SECRET are
// set. Uses incremental sync via syncToken and push notifications via watch
// channels. Reference: https://developers.google.com/calendar/api/guides/sync
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CalendarProvider, ChangeSet, ConnectionCtx, ExternalEvent, OutboundEvent, TokenSet, WatchChannel } from "../types";

const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary";
const SCOPE = "https://www.googleapis.com/auth/calendar";

async function gfetch(ctx: ConnectionCtx, url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${ctx.accessToken}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  if (res.status === 410) throw Object.assign(new Error("SYNC_TOKEN_EXPIRED"), { code: 410 }); // full resync required
  if (!res.ok) throw new Error(`google ${init.method ?? "GET"} ${res.status}: ${await res.text()}`);
  return res;
}
const toEvent = (it: any): ExternalEvent => ({
  externalId: it.id,
  etag: it.etag,
  summary: it.summary ?? "Busy",
  startsAt: it.start?.dateTime ?? it.start?.date ?? "",
  endsAt: it.end?.dateTime ?? it.end?.date ?? "",
  cancelled: it.status === "cancelled",
});

export class GoogleProvider implements CalendarProvider {
  readonly id = "google" as const;
  readonly supportsPush = true;
  readonly pollIntervalSec = 0; // push-driven

  getAuthUrl(state: string, redirectUri: string): string {
    const p = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri, response_type: "code", scope: SCOPE, access_type: "offline", prompt: "consent", state });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }
  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
    const j: any = await res.json();
    return { accessToken: j.access_token, refreshToken: j.refresh_token, expiresAt: new Date(Date.now() + j.expires_in * 1000).toISOString() };
  }
  async refresh(refreshToken: string): Promise<TokenSet> {
    const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ refresh_token: refreshToken, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, grant_type: "refresh_token" }) });
    const j: any = await res.json();
    return { accessToken: j.access_token, refreshToken, expiresAt: new Date(Date.now() + j.expires_in * 1000).toISOString() };
  }

  async listChanges(ctx: ConnectionCtx): Promise<ChangeSet> {
    const events: ExternalEvent[] = [];
    let pageToken: string | undefined;
    let nextSyncToken = ctx.syncToken ?? "";
    do {
      const q = new URLSearchParams({ showDeleted: "true", singleEvents: "true", maxResults: "250" });
      if (ctx.syncToken) q.set("syncToken", ctx.syncToken); else q.set("timeMin", new Date(Date.now() - 30 * 86400e3).toISOString());
      if (pageToken) q.set("pageToken", pageToken);
      const j: any = await (await gfetch(ctx, `${CAL}/events?${q}`)).json();
      for (const it of j.items ?? []) events.push(toEvent(it));
      pageToken = j.nextPageToken;
      if (j.nextSyncToken) nextSyncToken = j.nextSyncToken;
    } while (pageToken);
    return { events, nextSyncToken };
  }
  async createEvent(ctx: ConnectionCtx, ev: OutboundEvent) {
    const j: any = await (await gfetch(ctx, `${CAL}/events`, { method: "POST", body: JSON.stringify({ summary: ev.summary, start: { dateTime: ev.startsAt }, end: { dateTime: ev.endsAt } }) })).json();
    return { externalId: j.id, etag: j.etag };
  }
  async updateEvent(ctx: ConnectionCtx, externalId: string, ev: OutboundEvent, etag?: string) {
    const j: any = await (await gfetch(ctx, `${CAL}/events/${externalId}`, { method: "PATCH", headers: etag ? { "If-Match": etag } : {}, body: JSON.stringify({ summary: ev.summary, start: { dateTime: ev.startsAt }, end: { dateTime: ev.endsAt } }) })).json();
    return { etag: j.etag };
  }
  async deleteEvent(ctx: ConnectionCtx, externalId: string) {
    await gfetch(ctx, `${CAL}/events/${externalId}`, { method: "DELETE" });
  }
  async watch(ctx: ConnectionCtx, webhookUrl: string): Promise<WatchChannel> {
    const clientState = crypto.randomUUID();
    const j: any = await (await gfetch(ctx, `${CAL}/events/watch`, { method: "POST", body: JSON.stringify({ id: crypto.randomUUID(), type: "web_hook", address: webhookUrl, token: clientState }) })).json();
    return { channelId: j.id, resourceId: j.resourceId, clientState, expiresAt: new Date(Number(j.expiration)).toISOString() };
  }
  async stopWatch(ctx: ConnectionCtx, channelId: string, resourceId: string) {
    await gfetch(ctx, `https://www.googleapis.com/calendar/v3/channels/stop`, { method: "POST", body: JSON.stringify({ id: channelId, resourceId }) });
  }
}
