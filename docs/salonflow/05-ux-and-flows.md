# 05 — UX/UX Wireframes, Admin Dashboard & Booking Flow

The interactive reference for the scheduling surface is the working prototype at
[`/calendar`](../../src/app/calendar). Wireframes below are text schematics; the calendar one
is already implemented in React.

## 1. Design principles

- **Mobile-first, thumb-reachable.** Every owner/staff task works one-handed on a phone.
  Desktop is an enhancement, not the baseline.
- **One primary action per screen.** No feature dump. The calendar's checkout panel and the
  booking flow each have a single dark CTA.
- **Color = meaning.** Services are color-coded consistently across calendar, booking, and
  reports (green=express, purple=custom, rose=hydra, blue=signature — see prototype tokens).
- **Zero-training defaults.** Vertical templates pre-fill services/hours; empty states teach
  the next step rather than showing a blank grid.
- **Accessibility built-in:** WCAG AA contrast, full keyboard nav on the calendar,
  `text-wrap: balance` on headings, focus-visible rings, reduced-motion honored.

## 2. Owner/staff admin — information architecture

```
Top nav: [Logo] Get Started · Calendar · Clients · Sales · Messages · Reports   [Apps][Chat][Profile]
```

- **Get Started** — the 6-step onboarding wizard (see §5). Disappears once complete.
- **Calendar** — the home screen. Day/Week/Month/Staff views, drag-and-drop, color-coded,
  real-time. Right-side **Checkout** drawer turns any appointment into a sale (services,
  add-ons, discounts, deposit, "Go to Payments"). *This is the implemented prototype.*
- **Clients** — searchable CRM list → client profile (history, spend, notes, photos,
  vertical profile, loyalty, memberships).
- **Sales** — payments, gift cards, daily takings, refunds.
- **Messages** — conversation view + campaign automations (confirmation, reminder, review,
  rebooking, birthday, win-back) with channel toggles (SMS/email/WhatsApp).
- **Reports** — dashboard cards + drill-downs (revenue, bookings, retention, no-shows, staff
  performance, top services, CLV, growth).
- **AI assistant** — persistent launcher (the "Chat" icon) available on every screen.

### Dashboard (Reports home) wireframe

```
┌────────────────────────────────────────────────────────────────────┐
│  This week  ▾                              [Ask AI: "how are we doing?"]│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│  │ Revenue │ │ Bookings│ │ No-shows│ │Retention│   ← trend sparkline │
│  │ €4,820  │ │   142   │ │   4 (3%)│ │   87%   │     on each card    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                    │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐   │
│  │ Revenue trend (line)       │  │ Top services (bar)           │   │
│  └────────────────────────────┘  └──────────────────────────────┘   │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐   │
│  │ Staff performance (table)  │  │ AI insights (cards w/ actions)│  │
│  │  Andre  48 appts  €1,610   │  │ "12 clients haven't booked in │  │
│  │  Mia    39 appts  €1,290   │  │  60d → send win-back?  [Run]" │  │
│  └────────────────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## 3. Calendar (implemented) — behavior spec

- **Time-grid** with fixed time gutter + N day/staff columns; appointments absolutely
  positioned by start/duration; multi-service appts render stacked.
- **Drag-and-drop** to reschedule (vertical = time, horizontal = day/staff); on drop, optimistic
  update + `PATCH /v1/appointments/{id}`; conflict/external-busy collisions are rejected with
  a toast and snap-back.
- **Gap & conflict detection**: empty bookable slots are subtly highlighted; overlaps and
  buffer violations are blocked at create time.
- **Real-time**: SSE/WebSocket per salon pushes other users' changes live (receptionist
  books → owner's calendar updates instantly).
- **Checkout drawer**: select appointment → review services/add-ons → apply
  discount/membership → take deposit or full payment → "Go to Payments".

## 4. Customer booking flow (online + marketplace share this engine)

```
Service ─▶ Staff ─▶ Date ─▶ Time ─▶ (Add-ons) ─▶ Details ─▶ Deposit ─▶ Confirm
```

Wireframe (mobile):

```
Step 1  Choose service          Step 4  Choose time
 ┌──────────────────────┐        ┌──────────────────────┐
 │ Facials              │        │  Fri 15 Aug          │
 │  ○ Express   45m €80  │        │  ▢ 13:00  ▢ 13:45    │
 │  ● Custom    60m €90  │        │  ▢ 14:30  ▣ 15:15    │  ← only true-free
 │  ○ Signature 90m €100 │        │  ▢ 16:00             │     slots shown
 └──────────────────────┘        └──────────────────────┘
Step 2  Choose staff             Step 7  Deposit
 ┌──────────────────────┐        ┌──────────────────────┐
 │ ● Andre   ★4.9        │        │ Pay €20 deposit to   │
 │ ○ Mia     ★4.8        │        │ secure your spot     │
 │ ○ Any available       │        │ [ Apple Pay ] [Card] │
 └──────────────────────┘        └──────────────────────┘
                                 Confirmation → calendar invite + SMS/email
```

Flow notes:
- **Availability is real** — slots come from `GET /v1/availability`, which already accounts
  for staff working hours, buffers, existing appointments, and **externally-synced busy
  time**. No double-booking is structurally possible.
- **Deposits reduce no-shows** — configurable per service; skipped when €0.
- **Guest-friendly** — OTP/magic-link; the booking creates a salon-scoped customer that can
  be claimed into a marketplace consumer account later.
- **Waitlist** — if no slot fits, "Join waitlist" captures the desired window; cancellations
  trigger an auto-offer (and the AI "fill empty slots" workflow).
- **Group & recurring** — add multiple services/people; recurring sets a `recurrenceId` and
  books the series with conflict checks.

## 5. Onboarding wizard (the <10-minute promise)

```
1 Business     name, vertical (→ template), timezone, currency
2 Services     pre-seeded by template; edit prices/durations inline
3 Staff        add members (or "just me"); invite by email/SMS
4 Hours        weekly working hours; sensible default 9–18 Mon–Sat
5 Calendar     one-tap connect Google / Microsoft / Apple (two-way sync)
6 Go live      copy your booking link / QR; "Take a test booking"
```

Each step is skippable and reversible; progress persists server-side
(`GET /v1/salons/{id}/onboarding`). The wizard never blocks — a salon can accept bookings
after step 2 and refine later. Completion is the activation metric.

## 6. Native app parity (Phase 2/3)

Same IA, native navigation. Calendar uses native gestures; booking uses Apple Pay / Google
Pay via Stripe PaymentSheet; push notifications for new bookings, cancellations, and the
daily schedule. Because everything is API-driven, the native apps are new clients of the
exact flows above — not reimplementations of logic.
