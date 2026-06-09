# SalonFlow — Build Status (read me first)

Last updated: autonomous overnight session.

## What's actually running — a working MVP app

A navigable, interactive SalonFlow application is built into this Next.js app under
**`/salonflow`** (start the app with `npm run dev`, open `http://localhost:3000/salonflow`).
It is real, working software — not a clickable mockup — backed by a shared in-browser store
so every screen reads and writes the same data.

| Route | What works |
|---|---|
| `/salonflow/dashboard` | Live KPIs (revenue, bookings, no-shows, AI-booked), revenue-by-day chart, top services, staff performance, AI-insight cards — all **computed from the store** |
| `/salonflow/calendar` | Week/Day views, color-coded appointments, **clickable** with a live Checkout panel; change status (booked/confirmed/completed/no-show/cancel) and the grid updates |
| `/salonflow/clients` | Searchable CRM, client detail panel (spend, points, tier, tags, notes, appointment history), **add-client modal that persists** |
| `/salonflow/services` | Service list with **add / edit / delete** (name, category, duration, price, deposit, online-bookable) |
| `/salonflow/book` | Full customer **booking flow** (service → staff → day → time → client → confirm) with **real availability** (no double-booking) that **writes a new appointment onto the calendar** |
| `/salonflow/assistant` | Working assistant: answers revenue/retention/quiet-day/top-service questions from live data, and **parses “book … for … with … on … at …” into a confirm-gated booking that actually lands on the calendar** |

Try the loop: open the **Assistant**, click *"Book a Custom Facial for Mark with Andre on
Friday at 2pm"*, hit **Confirm booking**, then open the **Calendar** — the appointment is
there (tagged `AI`). Or use the **Booking page** and watch it appear. State persists in
`localStorage` (clear it to reset the demo).

There is also a separate, static pixel-faithful reference of the GlossGenius screen at
**`/calendar`** (the original prototype that kicked this off).

## Verified

- All `/salonflow/*` routes return 200 and compile under Next 16 / Turbopack.
- `npx tsc --noEmit` passes clean.
- Screens verified by headless-Chromium screenshots (dashboard, calendar, clients, booking,
  assistant + the end-to-end AI booking flow).

## What is mock vs real — read this honestly

This is a **front-end MVP over an in-browser store**, deliberately. The production system is
fully specified in the sibling docs (`01`–`07` + `prisma/schema.prisma`), but the following
require **your credentials and decisions** and were **not** built (I won't fabricate them):

- **No backend / database** — the store is client-side (`lib/store.tsx`). Production swaps
  the mutators for the REST API in `04-api-and-auth.md` against the Postgres/Prisma schema.
- **No auth** — Clerk is designed in `04`; the demo assumes a logged-in owner.
- **No payments** — Stripe is designed in `02`/`04`; "Go to Payments" and deposits are UI
  only (no real charge).
- **No calendar sync** — the Google/Microsoft/Apple two-way sync (the product wedge) is
  architected in `02 §5` but needs OAuth apps + credentials to build.
- **No real comms** — SMS/email/WhatsApp confirmations are described, not sent.
- **The AI assistant is rule-based**, not an LLM. It performs real actions behind a
  confirmation gate to demonstrate the exact production UX, but production swaps in the
  Claude tool-using agent specified in `06-ai-assistant.md` (the `@anthropic-ai/sdk`
  dependency is already in the project).

## Suggested next steps (in priority order)

1. **Stand up the backend**: scaffold the NestJS API + Postgres/Prisma from
   `prisma/schema.prisma` with RLS; point the store's mutators at it.
2. **Clerk auth** + the tenant guard (`02 §3`).
3. **Stripe Connect** for deposits/payments.
4. **Google two-way calendar sync** — highest-risk, most-defensible; do it first among
   integrations (`02 §5`).
5. **Real Claude assistant** — replace `assistant/page.tsx`'s `respond()` with the tool-using
   agent in `06`; the tool surface maps 1:1 to the API.

## File map (the demo app)

```
src/app/salonflow/
  layout.tsx              # nav + SalonProvider
  page.tsx                # → redirect to /dashboard
  components/top-nav.tsx
  lib/types.ts            # domain types + helpers (mirrors prisma schema)
  lib/seed.ts             # demo seed data
  lib/store.tsx           # React-context store: selectors + mutators (= future API calls)
  dashboard/page.tsx
  calendar/page.tsx       # interactive calendar + checkout
  clients/page.tsx        # CRM
  services/page.tsx       # service management
  book/page.tsx           # customer booking flow
  assistant/page.tsx      # working assistant (rule-based stand-in for the Claude agent)
```
