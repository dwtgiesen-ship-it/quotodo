# SalonFlow — Build Status (read me first)

Last updated: second autonomous session (added a real backend).

## Run it locally

```bash
npm install
npm run db:push     # create the local SQLite database (prisma/dev.db)
npm run db:seed     # load the demo salon (5 services, 3 staff, 8 clients, 18 appts)
npm run dev         # http://localhost:3000/salonflow
npm test            # 13 passing scheduling-logic tests
```

## What's running — a real full-stack MVP

A navigable SalonFlow application under **`/salonflow`**, now backed by a **real database
and REST API** (not just an in-browser store).

| Route | What works |
|---|---|
| `/salonflow/onboarding` | 6-step setup wizard (business → services → team → hours → calendar → go-live) that **persists settings via the API** |
| `/salonflow/dashboard` | Live KPIs, revenue chart, top services, staff performance, AI-insight cards — computed from API data |
| `/salonflow/calendar` | Week/day, color-coded, clickable, live checkout panel, status transitions — all persisted |
| `/salonflow/clients` | Searchable CRM, detail panel, add-client (persisted) |
| `/salonflow/services` | Add / edit / delete services (persisted) |
| `/salonflow/book` | Customer booking flow with **server-checked availability** (no double-booking) that writes to the DB |
| `/salonflow/assistant` | Rule-based assistant that answers from live data and books via the real API behind a confirm gate |

## What is REAL now (new this session)

- **Database**: SQLite via **Prisma** (`prisma/schema.prisma`), seeded from `prisma/seed.ts`.
- **REST API** under **`/api/salonflow/*`** — `state`, `availability`, `appointments`
  (book / move / status / cancel, **idempotent**, **409 on conflict**), `clients`,
  `services`, `settings`. Implemented in `src/lib/salonflow/repo.ts`.
- **Shared, unit-tested scheduling logic** (`src/lib/salonflow/availability.ts`) — overlap,
  conflict detection, bookable-slot computation. **13 vitest tests, all green.**
- **Front-end wired to the API**: the store hydrates from `GET /api/salonflow/state` and
  persists every mutation; re-hydrates from the server on any failure. Verified end-to-end —
  a booking made through the UI assistant persists to SQLite and survives a page reload.

Verified: `tsc --noEmit` clean · `npm test` 13/13 · all routes 200 · UI→API→DB→reload proven
via headless Chromium (POST 201, conflict 409).

## What is still mock — needs YOUR credentials/decisions (not built; not faked)

- **No auth** — Clerk is designed in `04`; the API is scoped to a single demo salon
  (`DEMO_SALON_ID`). Production swaps this for the authenticated org + the RLS tenant guard.
- **No payments** — Stripe designed in `02`/`04`; "Go to Payments"/deposits are UI only.
- **No real calendar sync** — Google/MS/Apple two-way sync (the wedge) is architected in
  `02 §5`; needs OAuth apps + secrets.
- **No real comms** — SMS/email/WhatsApp are described, not sent.
- **Assistant is rule-based**, not an LLM — no `ANTHROPIC_API_KEY` is available in this
  environment. It performs real API actions behind a confirm gate to demonstrate the exact
  production UX; production swaps in the Claude tool-using agent from `06-ai-assistant.md`
  (the tool surface maps 1:1 to the `/api/salonflow/*` endpoints already built).
- **SQLite, not Postgres** — chosen so the backend runs with zero external services. The
  production Postgres + RLS schema lives in `docs/salonflow/prisma/schema.prisma`; the
  field shapes match, so porting is mechanical.

## Architecture map (what was added)

```
prisma/
  schema.prisma          # SQLite dev schema
  seed.ts                # demo seed (npm run db:seed)
src/lib/
  prisma.ts              # Prisma client singleton
  salonflow/
    availability.ts      # pure scheduling logic (tested)
    availability.test.ts # 13 vitest tests
    repo.ts              # Prisma-backed data access + DTO serializers
    constants.ts         # DEMO_SALON_ID (= future authenticated tenant)
src/app/api/salonflow/
  state/                 # GET full salon state
  availability/          # GET bookable slots
  appointments/          # POST book; [id] PATCH move/status, DELETE cancel
  clients/               # POST add
  services/              # POST upsert; [id] DELETE
  settings/              # PATCH
src/app/salonflow/       # the UI (now API-backed); + onboarding/ wizard
```

## Suggested next steps (priority order)

1. **Clerk auth** + replace `DEMO_SALON_ID` with the authenticated org; add the RLS tenant
   guard when moving to Postgres.
2. **Port to Postgres** using `docs/salonflow/prisma/schema.prisma` (enums/RLS) — repo layer
   barely changes.
3. **Stripe Connect** for deposits/payments.
4. **Google two-way calendar sync** — highest-risk, most-defensible; do it first.
5. **Real Claude assistant** — replace `assistant/page.tsx`'s `respond()` with the tool-using
   agent in `06`; tools call the `/api/salonflow/*` endpoints that already exist.
