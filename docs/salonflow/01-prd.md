# 01 — Product Requirements Document & MVP

## 1. Vision

Build the easiest salon-management software in the world. A salon owner goes from signup to
accepting online bookings in **under 10 minutes**, with near-zero training. We win on
**ease, speed, automation, and the best calendar sync in the market** — then expand into a
consumer marketplace.

## 2. Problem

Incumbents (Fresha, Vagaro, Treatwell, Timely, Salonized) are feature-rich but heavy:
multi-hour onboarding, cluttered UIs, weak or one-way calendar sync, and shallow automation.
Small salons (1–10 chairs) churn because the software feels like work. Owners want to run
their day from their phone and stop doing admin at 11pm.

## 3. Target users & jobs-to-be-done

| Vertical | Distinctive need |
|---|---|
| Hair / barber | Fast rebooking, staff commission, walk-ins |
| Nails / lash / brow | Design galleries, before/after photos, preferred tech |
| Beauty / spa | Memberships, packages, multi-service appointments, rooms |
| Pet grooming | Pet profiles (breed, weight, coat, vaccination, behaviour) |

**Roles:** Business Owner (full control), Staff Member (own schedule + clients),
Receptionist (front desk: book/cancel/manage customers), Customer (book/pay/reschedule/
waitlist/memberships). Full permission matrix in `04-api-and-auth.md`.

## 4. Goals & non-goals

**Goals (12 months):** <10-min setup; mobile-first parity; two-way real-time calendar sync
with zero double-bookings; AI assistant that books, reschedules, and surfaces insights;
Stripe payments incl. deposits, memberships, gift cards; automated SMS/email/WhatsApp
lifecycle; multi-location & multi-staff.

**Non-goals (v1):** full accounting/payroll suite; inventory/retail POS depth; native apps
(Phase 2); public marketplace launch (Phase 4 — architected now, not shipped).

## 5. Top-level requirements

- **Onboarding wizard** — business → services → staff → hours → calendar connect → "share
  your booking link". Each step skippable and reversible; sensible defaults pre-filled by
  vertical template (e.g. "Nail salon" seeds Express/Custom/Gel services).
- **Calendar** — day/week/month/staff views, drag-and-drop, color-coded services, real-time
  updates, conflict + gap detection, two-way external sync.
- **Booking** — online booking page; service → staff → date → time → deposit → confirm;
  add-ons, packages, group + recurring bookings, waitlists.
- **CRM** — contact, notes, preferences, history, spend, photos; vertical extensions (pet,
  nail) modeled as typed JSON profiles.
- **Payments** — deposits, full payment, refunds, gift cards, memberships, subscriptions
  (Stripe Connect; salon is the merchant of record).
- **Memberships & loyalty** — recurring billing, included treatments, discounts, points,
  referrals, VIP tiers, birthday rewards.
- **Automated comms** — confirmations, reminders, review requests, rebooking nudges,
  birthday & win-back campaigns over SMS/email/WhatsApp.
- **Reporting** — revenue, bookings, retention, no-shows, staff performance, top services,
  CLV, growth trends.
- **AI assistant** — natural-language scheduling + analytics + workflow automation in the
  dashboard (see `06-ai-assistant.md`).

## 6. Key non-functional requirements

- p95 API latency < 300ms for calendar reads; booking write < 800ms incl. payment intent.
- 99.9% availability target; multi-AZ; designed for multi-region (Phase 4).
- Tenant isolation enforced at the database (RLS), not just app code.
- PCI scope minimized — card data never touches our servers (Stripe Elements / PaymentSheet).
- GDPR/CCPA: data export + delete per customer; EU data residency option (Phase 3+).

## 7. Success metrics

Activation: % of signups that take a booking within 24h (target >40%). Time-to-first-booking
(target <10 min). Calendar-sync adoption (target >60% of active salons). 90-day logo
retention (target >85%). AI assistant weekly-active (target >50% of owners).

---

## 8. MVP Definition (ship in ~12 weeks)

The MVP proves the wedge — **effortless setup + the calendar + online booking + reminders +
deposits** — for a single-location salon. Everything else is fast-follow.

**In:**
- Clerk auth; org = salon; owner + staff roles.
- Onboarding wizard with vertical templates.
- Services (name, duration, price, category, add-ons), staff, working hours.
- Calendar: day/week/staff views, drag-and-drop, conflict detection, color-coded.
- **Google Calendar two-way sync** (the highest-coverage provider) — Microsoft/Apple in
  fast-follow. This de-risks the hardest feature first.
- Public booking page: service → staff → date/time → deposit → confirm.
- Stripe Connect: deposits + full payment + refunds.
- Customer CRM: profile, history, notes, photos.
- Automated booking confirmation + 24h reminder (SMS + email).
- Basic dashboard: today's schedule, revenue this week, upcoming, no-shows.
- AI assistant v0: read-only Q&A over the salon's data ("how much did we make last week?",
  "who hasn't booked in 60 days?") — scoped, low-risk, high-wow.

**Explicitly out of MVP (fast-follow, sequenced in `07`):** memberships/loyalty, WhatsApp,
multi-location, group/recurring bookings, packages, marketplace, native apps, AI write
actions (booking/moving appointments), advanced reporting.

**MVP cutline rationale:** the MVP must demonstrate the three things competitors do
poorly — sub-10-minute setup, a genuinely pleasant calendar, and real two-way sync — plus
the revenue-proving loop (online booking + deposit). AI write-actions are deferred to
fast-follow so we ship the assistant in read-only "trust-building" mode first.
