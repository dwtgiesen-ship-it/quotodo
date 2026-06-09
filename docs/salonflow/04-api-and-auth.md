# 04 — API Design & Authentication

## 1. Principles

- **One versioned REST API** (`/v1/...`), OpenAPI 3.1, JSON. It is the single boundary for
  web, iOS, Android, the booking widget, and the AI assistant. No business logic leaks into
  clients.
- **Resource-oriented**, predictable, paginated (cursor-based), filterable. Money in minor
  units; timestamps ISO-8601 UTC.
- **Idempotent writes**: all create/mutate endpoints accept an `Idempotency-Key` header
  (required for booking + payment) so retries from flaky mobile networks are safe.
- **Webhooks out** (`appointment.*`, `payment.*`, etc., HMAC-signed) for integrators and our
  own native push pipeline; **webhooks in** from Stripe, Twilio, Google, Microsoft.

## 2. Authentication & authorization

**Clerk is the identity provider.** A Clerk **Organization** is a SalonFlow **Salon**
(tenant). Flow:

1. Client authenticates with Clerk (web SDK, or Clerk iOS/Android SDK) and receives a JWT.
2. Every API request sends `Authorization: Bearer <clerk_jwt>`.
3. A NestJS `AuthGuard` verifies the JWT against Clerk's JWKS, extracts `userId`, `orgId`
   (→ `salonId`), and `role`.
4. A `TenantInterceptor` opens the request DB transaction and runs
   `SET LOCAL app.current_salon_id = <salonId>` — activating RLS (see `02`/`03`).
5. A `RolesGuard` enforces the permission matrix below per route.

**Customer-facing auth (booking, customer portal):** consumers are lighter-weight — a Clerk
end-user identity scoped to the consumer app, or a magic-link/OTP session for guest bookings.
Guest bookings create a salon-scoped `Customer` and can be claimed later.

**Service-to-service & AI:** the AI assistant calls the API with the *acting user's* token
(on-behalf-of), so it inherits that user's permissions and tenant scope — it never gets
ambient DB access. Background workers use a scoped internal credential that sets
`app.current_salon_id` explicitly per job.

### Permission matrix (summary)

| Capability | Owner | Manager | Staff | Receptionist | Customer |
|---|:--:|:--:|:--:|:--:|:--:|
| View own schedule | ✓ | ✓ | ✓ | ✓ | — |
| View all schedules | ✓ | ✓ | — | ✓ | — |
| Book / reschedule / cancel | ✓ | ✓ | own | ✓ | own |
| Manage services & pricing | ✓ | ✓ | — | — | — |
| Manage staff & roles | ✓ | ✓ | — | — | — |
| Manage memberships/loyalty | ✓ | ✓ | — | — | — |
| Refunds | ✓ | ✓ | — | — | — |
| Reports & analytics | ✓ | ✓ | own | — | — |
| Marketing / campaigns | ✓ | ✓ | — | — | — |
| Customer database | ✓ | ✓ | read | ✓ | own profile |
| Book online / pay / waitlist | — | — | — | — | ✓ |

## 3. Core endpoints (representative)

```
# Onboarding & salon
POST   /v1/salons                         create salon (post-Clerk-org)
PATCH  /v1/salons/{id}                     business profile, timezone, vertical
GET    /v1/salons/{id}/onboarding         wizard state
POST   /v1/salons/{id}/onboarding/seed    apply vertical template (services/staff defaults)

# Catalog
GET    /v1/services        POST /v1/services        PATCH/DELETE /v1/services/{id}
GET    /v1/service-categories ...           POST /v1/services/{id}/addons

# Staff & availability
GET/POST /v1/staff   PATCH/DELETE /v1/staff/{id}
PUT    /v1/staff/{id}/availability         weekly rules
POST   /v1/staff/{id}/time-off
GET    /v1/staff/{id}/calendar-connections
POST   /v1/staff/{id}/calendar-connections/{provider}/oauth   begin OAuth

# Scheduling (the calendar)
GET    /v1/appointments?from&to&staffId&view=week    range query (calendar)
POST   /v1/appointments                    (Idempotency-Key) create booking
PATCH  /v1/appointments/{id}               reschedule / status (drag-drop)
DELETE /v1/appointments/{id}               cancel
GET    /v1/availability?serviceId&staffId&date        bookable slots (conflict+buffer aware)
POST   /v1/waitlist

# Customers / CRM
GET/POST /v1/customers   GET/PATCH /v1/customers/{id}
PUT    /v1/customers/{id}/profile/{type}   pet/nail typed profile (Zod-validated)
POST   /v1/customers/{id}/photos           presigned S3 upload
GET    /v1/customers/{id}/history

# Payments
POST   /v1/payments/intents                deposit/full (returns Stripe client secret)
POST   /v1/payments/{id}/refund
POST   /v1/gift-cards                       POST /v1/gift-cards/{code}/redeem

# Memberships & loyalty
GET/POST /v1/membership-plans
POST   /v1/customers/{id}/memberships       subscribe (Stripe)
GET    /v1/customers/{id}/loyalty           balance + ledger

# Comms
GET/PUT /v1/campaigns                       lifecycle automations
POST   /v1/messages/test                     preview a template

# Reporting
GET    /v1/reports/overview?from&to         revenue, bookings, no-shows, retention
GET    /v1/reports/staff                     performance
GET    /v1/reports/services                  popularity
GET    /v1/reports/customers/clv

# AI assistant
POST   /v1/assistant/messages                NL request → assistant turn (SSE stream)

# Marketplace (Phase 4)
GET    /v1/discovery/salons?lat&lng&service&date&minRating&maxPrice
GET    /v1/discovery/salons/{slug}/availability

# Webhooks in
POST   /v1/webhooks/stripe
POST   /v1/webhooks/twilio
POST   /v1/webhooks/google-calendar
POST   /v1/webhooks/microsoft-graph
```

## 4. Booking write — the critical path

`POST /v1/appointments` is transactional and must never double-book:

1. Validate request + `Idempotency-Key` (replay returns the original result).
2. Open tenant transaction (RLS active).
3. **Re-check availability under a row lock** on the staff member's time range (the partial
   index on active appointments + a `SELECT ... FOR UPDATE` window query) — also excludes
   external busy blocks synced from the staff's calendar.
4. Insert `Appointment` + `AppointmentService` lines.
5. If a deposit is due, create the Stripe PaymentIntent and attach it.
6. Write `OutboxEvent('appointment.booked')` in the **same** transaction.
7. Commit. The outbox relay then fans out: confirmation comms, outbound calendar mirror,
   loyalty, analytics — all async, all idempotent.

This keeps the synchronous path fast (< 800ms incl. payment intent) while everything
non-essential happens off the hot path.

## 5. Versioning, errors, limits

- **Versioning**: URI-versioned (`/v1`); additive changes don't bump; breaking changes ship
  `/v2` with an overlap window. Generated SDKs (TS/Swift/Kotlin) track the spec.
- **Errors**: RFC 9457 problem+json (`type`, `title`, `status`, `detail`, `code`,
  `traceId`).
- **Rate limiting**: per-salon + per-IP token buckets in Redis; stricter limits on auth and
  public booking endpoints; `Retry-After` on 429.
- **Pagination**: opaque cursors; `limit` ≤ 100.
