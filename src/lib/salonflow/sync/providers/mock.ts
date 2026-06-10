// In-memory provider that drives the demo through the exact same interface as
// the real adapters. Lets the full pipeline (OAuth → watch → pull → reconcile →
// push → echo-suppression) run with zero credentials. State lives on globalThis
// so it survives Next.js HMR within a dev session.

import type {
  CalendarProvider,
  ChangeSet,
  ConnectionCtx,
  ExternalEvent,
  OutboundEvent,
  TokenSet,
  WatchChannel,
} from "../types";

type Store = Map<string, Map<string, ExternalEvent>>; // connectionId -> externalId -> event
const g = globalThis as unknown as { __sfMockCal?: Store };
const store: Store = (g.__sfMockCal ??= new Map());

function bucket(connId: string): Map<string, ExternalEvent> {
  let m = store.get(connId);
  if (!m) { m = new Map(); store.set(connId, m); }
  return m;
}
const etag = () => "etag-" + Math.random().toString(36).slice(2, 10);

export class MockProvider implements CalendarProvider {
  readonly id = "google" as const; // identity is set by the factory wrapper
  readonly supportsPush = true;
  readonly pollIntervalSec = 60;

  getAuthUrl(state: string): string { return `/api/salonflow/sync/oauth/callback?provider=mock&code=mock-code&state=${encodeURIComponent(state)}`; }
  async exchangeCode(): Promise<TokenSet> { return { accessToken: "mock-access", refreshToken: "mock-refresh", expiresAt: new Date(Date.now() + 3600e3).toISOString() }; }
  async refresh(): Promise<TokenSet> { return { accessToken: "mock-access-" + Date.now(), refreshToken: "mock-refresh", expiresAt: new Date(Date.now() + 3600e3).toISOString() }; }

  async listChanges(ctx: ConnectionCtx): Promise<ChangeSet> {
    const events = [...bucket(ctx.connectionId).values()];
    return { events, nextSyncToken: "v-" + Date.now() };
  }
  async createEvent(ctx: ConnectionCtx, ev: OutboundEvent): Promise<{ externalId: string; etag: string }> {
    const externalId = "ext-" + Math.random().toString(36).slice(2, 10);
    const e = etag();
    bucket(ctx.connectionId).set(externalId, { externalId, etag: e, summary: ev.summary, startsAt: ev.startsAt, endsAt: ev.endsAt, cancelled: false });
    return { externalId, etag: e };
  }
  async updateEvent(ctx: ConnectionCtx, externalId: string, ev: OutboundEvent): Promise<{ etag: string }> {
    const e = etag();
    bucket(ctx.connectionId).set(externalId, { externalId, etag: e, summary: ev.summary, startsAt: ev.startsAt, endsAt: ev.endsAt, cancelled: false });
    return { etag: e };
  }
  async deleteEvent(ctx: ConnectionCtx, externalId: string): Promise<void> {
    const ev = bucket(ctx.connectionId).get(externalId);
    if (ev) bucket(ctx.connectionId).set(externalId, { ...ev, cancelled: true, etag: etag() });
  }
  async watch(ctx: ConnectionCtx): Promise<WatchChannel> {
    return { channelId: "chan-" + Math.random().toString(36).slice(2, 8), resourceId: "res-" + ctx.connectionId, clientState: "secret-" + Math.random().toString(36).slice(2, 10), expiresAt: new Date(Date.now() + 7 * 86400e3).toISOString() };
  }
  async stopWatch(): Promise<void> { /* no-op */ }

  // Demo-only: simulate an external personal event appearing on the calendar.
  injectExternalEvent(connectionId: string, ev: ExternalEvent): void {
    bucket(connectionId).set(ev.externalId, ev);
  }
}

export const mockProvider = new MockProvider();
export function injectMockEvent(connectionId: string, ev: ExternalEvent) {
  mockProvider.injectExternalEvent(connectionId, ev);
}
