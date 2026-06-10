// Calendar-sync provider abstraction. Every provider (Google, Microsoft, Apple)
// implements this one interface; the engine, queue, and UI are provider-agnostic.

export type ProviderId = "google" | "microsoft" | "apple";

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null; // ISO
};

/** A normalized external calendar event, provider-independent. */
export type ExternalEvent = {
  externalId: string;
  etag: string;
  summary: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  cancelled: boolean;
};

export type ChangeSet = {
  events: ExternalEvent[];
  nextSyncToken: string; // delta link / syncToken / ctag for the next incremental pull
};

export type WatchChannel = {
  channelId: string;
  resourceId: string;
  clientState: string; // secret echoed back in webhook notifications for verification
  expiresAt: string; // ISO — push subscriptions expire and must be renewed
};

/** Per-connection auth + cursor handed to provider calls. */
export type ConnectionCtx = {
  connectionId: string;
  accessToken: string;
  refreshToken: string;
  externalAccount: string;
  syncToken: string | null;
};

/** Outbound payload when mirroring one of our appointments into an external calendar. */
export type OutboundEvent = {
  summary: string;
  startsAt: string;
  endsAt: string;
};

export interface CalendarProvider {
  readonly id: ProviderId;
  /** Whether the provider supports push notifications (Google/Graph) vs poll-only (Apple CalDAV). */
  readonly supportsPush: boolean;
  /** Recommended poll interval (seconds) when push is unavailable. */
  readonly pollIntervalSec: number;

  // OAuth onboarding
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;

  // Incremental two-way sync
  listChanges(ctx: ConnectionCtx): Promise<ChangeSet>;
  createEvent(ctx: ConnectionCtx, ev: OutboundEvent): Promise<{ externalId: string; etag: string }>;
  updateEvent(ctx: ConnectionCtx, externalId: string, ev: OutboundEvent, etag?: string): Promise<{ etag: string }>;
  deleteEvent(ctx: ConnectionCtx, externalId: string): Promise<void>;

  // Push subscriptions (optional — Apple is poll-only)
  watch?(ctx: ConnectionCtx, webhookUrl: string): Promise<WatchChannel>;
  stopWatch?(ctx: ConnectionCtx, channelId: string, resourceId: string): Promise<void>;
}
