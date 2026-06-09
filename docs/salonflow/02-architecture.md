# 02 — System Architecture

Covers: complete SaaS architecture, multi-tenancy, scalability, event-driven core,
mobile/API-first, and the marketplace.

## 1. Topology (Phase 1)

```
                         ┌─────────────────────────────────────────────┐
   Web (Next.js)         │                  AWS                         │
   iOS (SwiftUI)  ──────▶│  CloudFront ─▶ ALB ─▶ NestJS API (ECS        │
   Android (Kotlin)      │                       Fargate, autoscaled)   │
   Booking widget        │                         │                    │
                         │        ┌────────────────┼───────────────┐    │
   Clerk (auth) ────────▶│        ▼                ▼               ▼    │
   Stripe webhooks ─────▶│   RDS Postgres   ElastiCache(Redis)   S3     │
   Twilio / Graph /      │   (Multi-AZ,RLS)  (cache + BullMQ)  (photos) │
   Google webhooks       │        ▲                │                    │
                         │        │         ┌──────┴──────┐             │
                         │   Worker fleet ◀─│  BullMQ jobs │             │
                         │   (ECS Fargate)  └─────────────┘             │
                         │     notifications · calendar-sync ·          │
                         │     loyalty · analytics rollups · AI tasks   │
                         └─────────────────────────────────────────────┘
```

- **API**: NestJS modular monolith on ECS Fargate behind an ALB; stateless, horizontally
  autoscaled on CPU + request count.
- **Workers**: same image, different entrypoint, consuming BullMQ queues. Scaled
  independently from the API.
- **Data**: RDS Postgres (Multi-AZ) primary + read replica for analytics; ElastiCache Redis
  for cache, sessions hints, rate limiting, and the BullMQ broker; S3 for client photos and
  generated documents; CloudFront in front of both web and S3 assets.

## 2. Why a modular monolith (not microservices)

The product thesis is **speed and simplicity**. A monolith with hard internal module
boundaries gives us: one deploy, one transaction boundary for booking+payment+calendar,
trivial local dev (critical for "ship fast"), and no premature distributed-systems tax.
Modules communicate **only** through (a) typed service interfaces and (b) domain events — so
when a module (e.g. `calendar-sync` or `notifications`) needs independent scaling or a
separate team, it lifts out into its own service with a known contract. We get the
extraction option without paying for it now.

**Modules:** `identity` (Clerk integration, roles), `salon` (tenant, locations, settings),
`catalog` (services, add-ons, packages), `staff` (members, availability, commissions),
`scheduling` (appointments, conflicts, gaps), `calendar-sync`, `booking` (public flow,
waitlists), `crm` (customers, profiles, photos), `payments` (Stripe), `memberships`,
`loyalty`, `comms` (templates, campaigns), `analytics`, `ai`, `marketplace`.

## 3. Multi-tenancy

**Model: shared database, shared schema, row-level security.** Chosen over schema-per-tenant
or db-per-tenant because we target 100k+ small salons — per-tenant schemas don't scale
operationally (migrations, connection pools). Isolation is enforced in three layers:

1. **Identity**: a Clerk **Organization** == a SalonFlow **Salon** (tenant). Every JWT
   carries `org_id` and the user's role.
2. **Request scoping**: a NestJS guard extracts `salon_id` from the verified JWT and opens a
   DB transaction that runs `SET app.current_salon_id = '<uuid>'`. The ORM never trusts a
   `salon_id` from the request body for filtering.
3. **Database (the firewall)**: every tenant table has `salon_id uuid not null`. A Postgres
   **RLS policy** restricts every row to `salon_id = current_setting('app.current_salon_id')`.
   Even a SQL-injection or an ORM bug cannot cross tenants. Platform-admin access uses a
   separate role that bypasses RLS, audited.

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON appointments
  USING (salon_id = current_setting('app.current_salon_id')::uuid);
```

**Connection pooling**: PgBouncer in transaction mode; `SET app.current_salon_id` is issued
per transaction (not per session) so it's pool-safe.

**Noisy-neighbor**: per-salon rate limits in Redis; heavy analytics run on the read replica;
large async work (campaign sends) is chunked through BullMQ with per-tenant concurrency caps.

## 4. Event-driven core (the automation backbone)

Every meaningful state change emits a **domain event**. To avoid dual-write bugs, we use the
**transactional outbox**: the business write and the event row commit in the same DB
transaction; a relay polls the outbox and publishes to BullMQ.

```
booking.confirmed ─┬─▶ comms        (send confirmation SMS + email)
                   ├─▶ calendar-sync (push to Google/MS/Apple)
                   ├─▶ loyalty       (award points)
                   ├─▶ analytics     (increment rollups)
                   └─▶ marketplace   (update availability index)  [Phase 4]
```

Core events: `appointment.{booked,rescheduled,cancelled,completed,no_show}`,
`payment.{intent_created,captured,refunded}`, `membership.{created,renewed,cancelled}`,
`customer.created`, `review.requested`, `external_calendar.event_changed`. Consumers are
idempotent (keyed on event id) and retried with backoff; a dead-letter queue surfaces
failures to ops.

## 5. Calendar sync (the wedge) — deep dive

Two-way, near-real-time, conflict-safe sync across Google Calendar, Microsoft 365/Outlook
(Graph), and Apple (CalDAV).

- **Inbound (external → SalonFlow)**: subscribe to push notifications — Google `watch`
  channels, Graph `subscriptions`, CalDAV polling (no push; 1–5 min poll). On change, fetch
  the delta (`syncToken` / `deltaLink`) and reconcile. External busy blocks become
  `unavailable` time so we never double-book a staff member who has a dentist appointment.
- **Outbound (SalonFlow → external)**: on `appointment.*` events, upsert the mirror event in
  the staff member's connected calendar, storing the external event id on our appointment.
- **Conflict policy**: SalonFlow is source-of-truth for *SalonFlow-created* appointments;
  external calendars are source-of-truth for *external* events (treated as availability
  blocks). Last-writer-wins is rejected — we reconcile by origin. An `idempotency_key` per
  appointment + stored external etags prevent echo loops (our outbound write must not
  re-trigger an inbound "change").
- **Token storage**: OAuth refresh tokens encrypted at rest (KMS) in `calendar_connections`;
  refresh handled by a scheduled worker before expiry.
- **Failure isolation**: a provider outage degrades to queued retries; bookings still
  succeed locally and reconcile when the provider returns.

## 6. Mobile / API-first

There is **no mobile-specific backend**. iOS (SwiftUI) and Android (Kotlin) are first-class
clients of the same versioned REST API + webhooks that the web app uses. Enablers:

- **One OpenAPI 3.1 spec** generated from NestJS decorators → typed clients for TS, Swift,
  and Kotlin. The contract is the product boundary.
- **Auth**: Clerk issues the same JWTs to native apps (Clerk has iOS/Android SDKs); the API
  doesn't care which client called it.
- **Push**: a `devices` table + a `push` consumer fan-out via APNs/FCM, fed by the same
  domain events that drive web realtime.
- **Realtime**: WebSocket/SSE channel scoped per salon for live calendar updates; native and
  web subscribe identically.
- **Offline-tolerant writes**: booking and note mutations accept an `Idempotency-Key` header
  so a flaky phone connection can safely retry.

Because all logic lives behind the API, Phases 2–3 are *new clients*, not new systems.

## 7. Marketplace (Phase 4 — architected now)

The consumer marketplace ("discover salons, book directly") reuses the booking engine. What
we build now so it's additive later:

- **Public availability index**: a denormalized, read-optimized projection (Postgres +
  optional OpenSearch) updated from `appointment.*` and availability events. Marketplace
  search never hits the transactional tables.
- **Stable public IDs & slugs** on salons, services, and staff from day one.
- **Salon profile data** (location/geo, photos, categories, rating aggregate) modeled now,
  exposed later. Reviews are already collected via the review-request automation.
- **Two front doors, one booking core**: the salon's own booking page and the marketplace
  call the *same* booking API; marketplace just adds discovery (filters: location, service,
  availability, rating, price) and a unified consumer identity.
- **Payments**: Stripe Connect already makes each salon a connected merchant, so marketplace
  bookings settle to the salon with an optional platform fee — the monetization lever for
  Phase 4 (see `07`).

## 8. Scalability & reliability

- **Stateless API + workers**; scale horizontally. Sticky nothing.
- **Postgres**: start single-writer Multi-AZ + read replica. Path to scale: partition the
  hottest tables (`appointments`, `notifications`) by `salon_id` hash or by time; introduce
  Citus or read-replica sharding by tenant cohort before the single writer is the ceiling
  (well past 100k salons for this workload).
- **Caching**: Redis for service catalogs, availability slices, and rate limits; cache keys
  namespaced by `salon_id` and busted on relevant events.
- **Multi-region (Phase 4)**: active-passive first (cross-region RDS replica + S3 CRR +
  Route53 failover), then regional cells for data-residency. Tenant→region pinning recorded
  on the salon row so routing is deterministic.
- **Observability**: OpenTelemetry traces, structured logs, per-tenant metrics; SLO
  dashboards on booking success rate and sync lag. Webhooks (Stripe/Graph/Google) verified
  by signature and de-duplicated by event id.
