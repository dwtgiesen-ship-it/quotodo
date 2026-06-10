// Apple Calendar via CalDAV (iCloud) + read-only iCal subscription feeds.
// CalDAV has no OAuth and no push — authentication is an app-specific password
// (collected in onboarding, stored encrypted) and changes are detected by
// polling the collection ctag, then fetching changed resources by etag.
// Reference: RFC 4791 (CalDAV), RFC 6578 (sync-collection).
// NOTE: production should parse iCalendar with a hardened library (e.g. node-ical);
// the minimal VEVENT extraction here covers the common case.
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CalendarProvider, ChangeSet, ConnectionCtx, ExternalEvent, OutboundEvent, TokenSet } from "../types";

const ICLOUD = process.env.APPLE_CALDAV_URL ?? "https://caldav.icloud.com";

function basic(ctx: ConnectionCtx) {
  // refreshToken field carries the app-specific password for CalDAV connections.
  return "Basic " + Buffer.from(`${ctx.externalAccount}:${ctx.refreshToken}`).toString("base64");
}
function field(vevent: string, key: string): string {
  const m = vevent.match(new RegExp(`${key}[^:]*:(.*)`));
  return m ? m[1].trim() : "";
}
function icalDate(v: string): string {
  // 20250813T140000Z or 20250813T140000
  const m = v.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return "";
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export class AppleProvider implements CalendarProvider {
  readonly id = "apple" as const;
  readonly supportsPush = false; // CalDAV has no webhooks — poll on an interval
  readonly pollIntervalSec = 300;

  getAuthUrl(): string { throw new Error("Apple CalDAV uses an app-specific password, not OAuth redirect"); }
  async exchangeCode(): Promise<TokenSet> { throw new Error("not applicable for CalDAV"); }
  async refresh(refreshToken: string): Promise<TokenSet> { return { accessToken: "", refreshToken, expiresAt: null }; }

  async listChanges(ctx: ConnectionCtx): Promise<ChangeSet> {
    // calendar-query REPORT for VEVENTs in a forward window; production narrows by sync-token.
    const body = `<?xml version="1.0"?><c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag/><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"/></c:comp-filter></c:filter></c:calendar-query>`;
    const res = await fetch(`${ICLOUD}/`, { method: "REPORT", headers: { Authorization: basic(ctx), "Content-Type": "application/xml", Depth: "1" }, body });
    if (!res.ok) throw new Error(`caldav REPORT ${res.status}`);
    const xml = await res.text();
    const events: ExternalEvent[] = [];
    for (const m of xml.matchAll(/<[^>]*response[^>]*>([\s\S]*?)<\/[^>]*response>/g)) {
      const block = m[1];
      const etag = (block.match(/getetag[^>]*>([^<]+)</)?.[1] ?? "").replace(/"/g, "");
      const ve = block.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/)?.[1];
      if (!ve) continue;
      const uid = field(ve, "UID");
      events.push({ externalId: uid, etag, summary: field(ve, "SUMMARY") || "Busy", startsAt: icalDate(field(ve, "DTSTART")), endsAt: icalDate(field(ve, "DTEND")), cancelled: /STATUS:CANCELLED/.test(ve) });
    }
    return { events, nextSyncToken: new Date().toISOString() };
  }
  async createEvent(ctx: ConnectionCtx, ev: OutboundEvent) {
    const uid = `${crypto.randomUUID()}@salonflow`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Schedulemode//EN", "BEGIN:VEVENT", `UID:${uid}`, `DTSTART:${ev.startsAt.replace(/[-:]/g, "").replace(/\.\d+/, "")}`, `DTEND:${ev.endsAt.replace(/[-:]/g, "").replace(/\.\d+/, "")}`, `SUMMARY:${ev.summary}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const res = await fetch(`${ICLOUD}/${uid}.ics`, { method: "PUT", headers: { Authorization: basic(ctx), "Content-Type": "text/calendar" }, body: ics });
    if (!res.ok) throw new Error(`caldav PUT ${res.status}`);
    return { externalId: uid, etag: (res.headers.get("ETag") ?? "").replace(/"/g, "") };
  }
  async updateEvent(ctx: ConnectionCtx, externalId: string, ev: OutboundEvent, etag?: string) {
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Schedulemode//EN", "BEGIN:VEVENT", `UID:${externalId}`, `DTSTART:${ev.startsAt.replace(/[-:]/g, "").replace(/\.\d+/, "")}`, `DTEND:${ev.endsAt.replace(/[-:]/g, "").replace(/\.\d+/, "")}`, `SUMMARY:${ev.summary}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const res = await fetch(`${ICLOUD}/${externalId}.ics`, { method: "PUT", headers: { Authorization: basic(ctx), "Content-Type": "text/calendar", ...(etag ? { "If-Match": `"${etag}"` } : {}) }, body: ics });
    if (!res.ok) throw new Error(`caldav PUT ${res.status}`);
    return { etag: (res.headers.get("ETag") ?? "").replace(/"/g, "") };
  }
  async deleteEvent(ctx: ConnectionCtx, externalId: string) {
    await fetch(`${ICLOUD}/${externalId}.ics`, { method: "DELETE", headers: { Authorization: basic(ctx) } });
  }
}
