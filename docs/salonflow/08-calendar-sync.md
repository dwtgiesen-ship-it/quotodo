# 08 — Calendar Synchronization Engine

Two-way, real-time calendar sync across **Google Calendar**, **Microsoft 365 / Outlook
(Graph)**, and **Apple (CalDAV + iCal)** — the product wedge. This documents the engine that
ships in this branch: production-grade architecture, runnable end-to-end in the demo through a
mock provider, with the real adapters written to each vendor's API and activated by
credentials.

## 1. Design goals → how they're met

| Requirement | Mechanism |
|---|---|
| Two-way sync | Inbound `pull` (provider → us) + outbound `push` (us → provider mirror) |
| Real-time | Push subscriptions (Google `watch`, Graph `subscriptions`) → webhook → enqueue pull. Apple has no push → interval poll |
| Double-booking prevention | Inbound personal events become `ExternalBusyBlock`s; the booking engine treats them as unavailability for that staff member |
| Conflict prevention | Reconciliation by **origin** (ours vs external), not last-writer-wins |
| Echo-loop prevention | We store `(externalId, etag)` per mirror; an inbound change with a matching etag is our own write returning and is skipped |
| Availability detection | `computeSlots` / `hasConflict` merge appointments **and** external busy blocks |
| Staff-specific calendars | One `CalendarConnection` per (staff, provider); mirrors and busy blocks are staff-scoped |
| Multi-location | `CalendarConnection.locationId` scopes connections per location |
| Sync status monitoring | `SyncLog` + `syncStatus()` → live dashboard (connections, queue depth, busy count, activity) |
| Retry queue | `SyncJob` with attempts, exponential backoff + jitter, and dead-lettering |
| Webhook handling | `/api/salonflow/sync/webhook/[provider]` — Graph validationToken handshake, Google header notifications, `clientState` verification |
| OAuth onboarding | `beginConnect` → provider auth URL → `/sync/oauth/callback/[provider]` → `completeOAuth` |

## 2. Architecture

```
            ┌────────── provider webhooks (Google/Graph) ──────────┐
            ▼                                                       │
  /api/.../sync/webhook/[provider]  ──verify clientState──▶  enqueue(pull)
                                                                    │
  booking write (book/move/cancel) ──enqueuePush──▶ SyncJob queue ──┤
                                                                    ▼
                                                   runDueJobs()  (cron/worker)
                                                        │
                          ┌─────────────────────────────┼───────────────────────┐
                          ▼                             ▼                         ▼
                   pull(connection)            pushAppointment()           renewWatch()
                          │                             │
            provider.listChanges()          provider.create/update/delete
                          │                             │
              reconcileInbound() ─┬─ echoes (skip)      └─ upsert ExternalEventLink (etag)
                                  ├─ ourEdited (surface)
                                  ├─ busyUpserts → ExternalBusyBlock ─▶ availability
                                  └─ cancellations → free the slot
```

- **Provider abstraction** (`sync/types.ts`, `sync/providers/*`): one `CalendarProvider`
  interface; `getProvider(id)` returns the live adapter when credentials are set, else the
  mock — so the engine, queue, routes, and UI are identical in demo and production.
- **Pure engine** (`sync/engine.ts`): `reconcileInbound`, `planOutbound`, `backoffSeconds` —
  no I/O, exhaustively unit-tested.
- **Orchestration** (`sync/service.ts`): connect/OAuth, pull, push, job dispatch, webhook
  ingest, monitoring — all tenant-scoped.
- **Durable queue** (`sync/queue.ts`): DB-backed in the demo; same shape over BullMQ/SQS in
  production.

## 3. Scaling to 100k+ salons / millions of events

- **Push over poll.** Google/Graph push subscriptions mean no constant polling; a thin
  webhook wakes a single incremental `pull` (delta token), so work is proportional to *change
  volume*, not calendar size. Apple (no push) polls on a per-connection interval.
- **Incremental sync.** Every provider uses a cursor (`syncToken` / `deltaLink` / `ctag`); we
  never re-list whole calendars after the initial backfill.
- **Stateless, idempotent workers.** `runDueJobs` claims jobs optimistically (`updateMany …
  where status='queued'`) so any number of workers run safely. Reconciliation is keyed on
  `(connectionId, externalId)` upserts — re-delivery is harmless.
- **Queue partitioning.** `SyncJob` carries `salonId`; in production the queue shards by salon
  (BullMQ queue-per-shard / SQS message group), giving per-tenant fairness and isolation.
- **Subscription renewal at scale.** Push subscriptions expire (Graph ~3 days); each renewal
  is itself a scheduled `watch_renew` job, spread over time rather than a thundering-herd cron.
- **Backpressure & failure isolation.** Exponential backoff + jitter + dead-letter contain a
  provider outage to retries; bookings still succeed locally and reconcile when the provider
  returns. A failing connection is flagged `error` without blocking others.
- **Token storage.** OAuth refresh tokens are encrypted at rest (KMS envelope) in production;
  the schema fields exist (`accessToken`/`refreshToken`) and are documented as encrypted.

## 4. What's real vs demo in this branch

| Piece | Demo (now) | Production (add credentials) |
|---|---|---|
| Provider adapters | `MockProvider` (in-memory) | `GoogleProvider`, `MicrosoftProvider`, `AppleProvider` — real HTTP, activate via `GOOGLE_CLIENT_ID/SECRET`, `MS_CLIENT_ID/SECRET`, `APPLE_CALDAV_URL`+`APPLE_LIVE` |
| OAuth | simulated exchange | real redirect → `/sync/oauth/callback/[provider]` → token exchange |
| Webhooks | `/sync/simulate` injects events | real Google/Graph notifications hit `/sync/webhook/[provider]` |
| Queue | DB-backed, run via dashboard "Run sync now" | same code over BullMQ/SQS + a worker/cron driving `runDueJobs` |
| DB | SQLite | Postgres + RLS (`docs/salonflow/prisma`) |
| Times | demo week anchored to Aug 2025, UTC | real datetimes resolved against salon/location IANA timezone |

The **engine, schema, routes, UI, and tests are the production design** — going live is wiring
credentials and a worker loop, not a rewrite.

## 5. Try it (demo)

Settings → **Calendar sync** (`/salonflow/settings/calendar`):
1. **Connect Google** for a staff member (demo OAuth completes instantly).
2. **Simulate** an external "Dentist" event → it syncs in and becomes a busy block.
3. Open the **Calendar** and try to book that staff at that time → it's **refused** (double-
   booking prevented). Book any appointment → a push job is enqueued to mirror it out.
4. Watch **Sync activity** and the queue update live.

## 6. Files

```
prisma/schema.prisma          CalendarConnection, CalendarChannel, ExternalEventLink,
                              ExternalBusyBlock, SyncJob, SyncLog
src/lib/salonflow/sync/
  types.ts                    CalendarProvider interface + DTOs
  engine.ts                   pure reconcile/plan/backoff  (+ engine.test.ts)
  queue.ts                    durable retry queue (backoff + dead-letter)
  service.ts                  orchestration (connect, pull, push, dispatch, webhook, status)
  time.ts                     slot ↔ ISO datetime bridge
  providers/{google,microsoft,apple,mock}.ts + index.ts (factory)
  sync.test.ts                end-to-end: external event blocks a booking; echo suppressed
src/app/api/salonflow/sync/   status, connect, disconnect, run, simulate,
                              webhook/[provider], oauth/callback/[provider]
src/app/salonflow/settings/calendar/page.tsx   connections + live sync dashboard
```
