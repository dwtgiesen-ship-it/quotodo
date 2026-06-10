# SalonFlow — Build Status (read me first)

Last updated: third autonomous session ("complete the app").

## Run it

```bash
npm install
npm run db:push     # create local SQLite db (prisma/dev.db)
npm run db:seed     # load the demo salon
npm run dev         # app:     http://localhost:3000/salonflow
                    # landing: http://localhost:3000/sf
npm test            # 13 passing scheduling-logic tests
```

## The app is now feature-complete (within the credential-free envelope)

A real full-stack salon platform: **Next.js UI → REST API → Prisma → SQLite**, every screen
reading/writing the same database.

| Area | Route | What works |
|---|---|---|
| Marketing site | `/sf` | Hero + product mock, features, pricing, CTAs into the app |
| Onboarding | `/salonflow/onboarding` | 6-step setup wizard, persists settings/services |
| Dashboard | `/salonflow/dashboard` | Live KPIs, charts, AI insights, **waitlist with one-click "book slot"** |
| Calendar | `/salonflow/calendar` | Week/day, **drag-and-drop reschedule** (conflict-checked), **click-a-gap quick-book**, live checkout, status transitions, toasts |
| Clients | `/salonflow/clients` | CRM + rich profile: membership, **loyalty ledger (earn/redeem)**, **photo gallery**, vertical (pet/nail) profile, editable notes, message/book actions |
| Services | `/salonflow/services` | Add / edit / delete |
| Memberships | `/salonflow/memberships` | Plans (Bronze/Silver/Gold), subscribe/cancel members (mock billing) |
| Messages | `/salonflow/messages` | 6 lifecycle automations with toggles, message log, one-off composer |
| Reports | `/salonflow/reports` | Revenue/retention/no-show/CLV/staff/channel analytics + **CSV export** |
| Settings | `/salonflow/settings` | Business info, **opening-hours editor**, **full team CRUD** (roles, services, colour) |
| Booking | `/salonflow/book` | Customer flow with server-checked availability |
| Assistant | `/salonflow/assistant` | NL Q&A + confirm-gated booking through the real API |

**Roles:** an owner/manager/staff/receptionist switcher (top-right) enforces the production
**permission matrix** — restricted areas hide from the nav and show a "not available for your
role" gate (Reports/Memberships/Messages/Settings require manager+).

## What's REAL

- **Database**: SQLite via Prisma (`prisma/schema.prisma`) — Salon, Service, Staff, Client,
  Appointment, MembershipPlan, MembershipUser, LoyaltyTransaction, Campaign, Message,
  WaitlistEntry, CustomerPhoto, + weekly hours and vertical profiles. Seeded by `prisma/seed.ts`.
- **REST API** (`/api/salonflow/*`): state, availability, appointments (book/move/status/
  cancel — idempotent, 409 on conflict), clients (+update), services, staff, settings,
  memberships, membership-plans, loyalty, campaigns, messages, waitlist, photos.
- **Shared, tested scheduling logic** (`src/lib/salonflow/availability.ts`) — 13 vitest tests.
- **Optimistic UI** that hydrates from and persists to the API; re-hydrates on failure.
- **Verified**: `tsc --noEmit` clean · `npm test` 13/13 · every route 200 · UI→API→DB→reload
  proven via headless Chromium.

## What is still mock — needs YOUR credentials (not built; not faked)

- **Auth** — single demo salon (`DEMO_SALON_ID`); the role switcher demonstrates RBAC.
  Production: Clerk org + the RLS tenant guard.
- **Payments** — Stripe designed in `02`/`04`; "Go to Payments", deposits, membership billing
  are UI only.
- **Calendar sync** — Google/MS/Apple two-way sync architected in `02 §5`; needs OAuth secrets.
- **Comms** — SMS/email/WhatsApp messages are logged, not delivered (no Twilio/Resend creds).
- **Assistant LLM** — rule-based (no `ANTHROPIC_API_KEY` here); executes real API actions
  behind a confirm gate. Production swaps in the Claude agent from `06`; tools map 1:1 to the
  endpoints that now exist.
- **Postgres** — local dev uses SQLite for zero-dependency running; the production Postgres +
  RLS schema lives in `docs/salonflow/prisma/schema.prisma` (field shapes match).
- **Photo storage** — gallery uses inline placeholders; production uploads to S3 (`02`).

## Next steps (priority)

1. Clerk auth + replace `DEMO_SALON_ID`; port to Postgres + RLS (`docs/salonflow/prisma`).
2. Stripe Connect (deposits, memberships, gift cards).
3. Google two-way calendar sync — highest-risk, most-defensible.
4. Real Claude assistant (replace `assistant/page.tsx` `respond()` with the tool-using agent).
5. S3 photo uploads; Twilio/Resend for real comms.
