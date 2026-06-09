# 07 — Roadmap, Cost Estimation, Monetization & Pitch

## 1. Development roadmap

### Phase 1 — Web SaaS (months 0–9)

| Window | Milestone | Key deliverables |
|---|---|---|
| M0–1 | Foundations | AWS infra (ECS/RDS/Redis/S3), NestJS skeleton + RLS multi-tenancy, Clerk auth, CI/CD, OpenAPI pipeline |
| M1–3 | **MVP** (see `01` §MVP) | Onboarding wizard, catalog/staff/hours, calendar (day/week/staff + drag-drop), **Google two-way sync**, online booking + deposits (Stripe Connect), CRM, confirmation+reminder comms, dashboard, AI read-only Q&A |
| M3–4 | Beta hardening | 25–50 design-partner salons, calendar-sync edge cases, performance, observability |
| M4–6 | Sync + payments depth | Microsoft 365 + Apple (CalDAV) sync, refunds/gift cards, packages, group/recurring bookings, waitlists, AI write-actions (book/reschedule, behind confirmation) |
| M6–9 | Growth engine | Memberships + loyalty, full automated comms incl. WhatsApp, campaigns (birthday/win-back), full reporting (CLV/retention/staff), multi-location, proactive AI insights |

### Phase 2 — iOS (months 9–12)
SwiftUI app over the existing API; Clerk iOS SDK; APNs push; Apple Pay via Stripe
PaymentSheet; offline-tolerant booking. Owner/staff first, then a customer booking app.

### Phase 3 — Android (months 12–15)
Kotlin/Jetpack Compose parity; FCM push; Google Pay. Same API, same contracts.

### Phase 4 — Marketplace (months 15–24)
Public discovery (location/service/availability/rating/price), unified consumer identity,
availability index (read projection + search), ratings surfaced, platform-fee monetization,
multi-region for data residency.

**Critical-path risk = calendar sync.** It's deliberately first (Google in MVP) so the
hardest, most-defensible feature is proven before we scale surface area.

## 2. Cost estimation

### Build (team) — first 12 months

| Role | Count | Notes |
|---|--:|---|
| Full-stack/back-end eng | 3 | NestJS, payments, sync |
| Front-end eng | 2 | Next.js web + design system |
| Mobile eng | 1 | starts ~M8 for Phase 2 |
| Product designer | 1 | |
| Eng lead / CTO | 1 | |
| Product/ops + support | 1 | design-partner success |

≈ 8–9 people. Loaded cost roughly **€1.0–1.5M/yr** depending on geography. Lean alternative:
a 4-person team can ship the MVP in ~12 weeks and reach Phase-1 GA in ~9 months at ~€500–700k.

### Infrastructure (monthly, by scale)

| Scale | ECS (API+workers) | RDS (Multi-AZ + replica) | Redis | S3+CloudFront | **Infra total** |
|---|--:|--:|--:|--:|--:|
| Beta (≤100 salons) | $150 | $200 | $60 | $40 | **~$450** |
| Growth (~2,000 salons) | $900 | $700 | $200 | $250 | **~$2,050** |
| Scale (~25,000 salons) | $4,500 | $3,500 | $900 | $1,500 | **~$10,400** |

### Per-tenant variable costs (pass-through-able)

- **Stripe**: ~1.5–2.9% + fixed per transaction — borne by the salon (we're the platform; we
  can add a platform fee, see monetization).
- **Twilio SMS**: ~$0.0075–0.04/segment; WhatsApp per-conversation pricing. Bundle an
  allowance per plan, meter overages.
- **Email (Resend)**: negligible (~$0.001/email).
- **Claude AI**: with Haiku-first routing, Sonnet default, prompt caching on the catalog
  prefix, a typical active salon runs **~$2–6/month** in AI tokens. Heavy power users with
  proactive automations: ~$10–20. This comfortably fits inside plan pricing (below). Caching
  the repeated system+catalog prefix is the single biggest cost lever (≈10× on input).

**Rule of thumb:** blended COGS per active salon at growth scale ≈ **€3–8/month** (infra +
comms allowance + AI), against €29–99 plan pricing → healthy gross margin (>80%).

## 3. Monetization strategy

**Primary: per-location SaaS subscription** (simple, predictable, what owners expect).

| Plan | Price | For | Includes |
|---|--:|---|---|
| **Starter** | €0–19/mo | solo / new | calendar, online booking, 1 calendar sync, SMS/email reminders (metered), basic reports |
| **Pro** | €49/mo | small salons | everything + memberships, loyalty, full automations, WhatsApp, AI assistant, multi-staff, full reports |
| **Premium** | €99/mo | multi-location/spas | everything + multi-location, advanced AI automations, priority support, API access |

Add-ons / secondary revenue:
- **Payments take-rate** — small platform fee on card processing via Stripe Connect (e.g.
  +0.5–1%), or a "free if you process with us" plan (the Fresha playbook) where subscription
  is low/zero and payments + marketplace fund the business.
- **Comms overages** — SMS/WhatsApp beyond the plan allowance, metered with margin.
- **AI metering** — generous included AI; power-automation tier or overage for heavy users.
- **Marketplace (Phase 4)** — commission on *new-client* bookings sourced through discovery
  (e.g. 15–20% first booking, 0% on the salon's own repeat clients — aligns incentives and
  avoids taxing existing relationships).
- **Deposits/no-show protection, gift cards, financing** — fintech attach over time.

**Why this works:** low entry price + sub-10-minute setup drives top-of-funnel; payments and
marketplace create usage-based upside that grows with the customer; AI and automations are
the retention moat.

## 4. Investor pitch summary

**SalonFlow — the salon software that runs itself.**

- **Problem.** 1M+ small salons run on software that's powerful but painful: hours to set
  up, cluttered, weak calendar sync, and almost no automation. Owners do admin at 11pm and
  churn off tools that feel like work.
- **Solution.** The easiest salon platform in the world: live and taking bookings in under
  10 minutes, mobile-first, with the **best two-way calendar sync in the market** and an
  **AI assistant that books, fills empty slots, and runs your marketing** — by talking to it.
- **Why now.** (1) Tool-using LLMs make a genuinely autonomous "AI receptionist" possible
  for the first time; (2) Stripe Connect + Clerk + cloud primitives let a small team ship a
  payments-grade, multi-tenant platform fast; (3) post-COVID, every salon expects online
  booking and contactless payments as table stakes.
- **Product wedge.** Calendar sync + effortless onboarding lands the account; payments,
  memberships, and AI automation deepen it; the marketplace turns our install base into a
  consumer demand channel — a flywheel incumbents' legacy stacks can't easily copy.
- **Business model.** €0–99/mo per location + payments take-rate + comms/AI metering +
  (Phase 4) marketplace commission on new-client bookings. >80% gross margin; multiple
  expansion vectors per account.
- **Moat.** Real-time two-way multi-provider calendar sync (hard to build, hard to copy),
  an AI layer that compounds with proprietary booking data, and a marketplace network effect
  that grows with every salon we add.
- **Architecture is the de-risking story.** API-first from day one — web today, iOS/Android
  and a consumer marketplace are *additive clients of the same system*, not rewrites. We can
  enter every future phase without re-platforming.
- **Traction plan.** 25–50 design-partner salons in beta (M3–4); Phase-1 GA at M9; land via
  the free/low Starter tier + the 10-minute setup hook; expand via payments + AI.
- **The ask.** Seed round to fund an 8–9 person team for 18 months to reach Phase-1 GA,
  prove activation/retention, and lay the iOS + marketplace groundwork — targeting the
  global leadership position in the category Fresha and Vagaro fragment today.

> **Vision:** every salon on earth runs its entire business — calendar, payments, clients,
> marketing — by talking to SalonFlow, and every customer discovers and books their next
> appointment through it.
