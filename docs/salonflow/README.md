# SalonFlow — Design & Architecture Package

> The easiest salon-management software in the world. Web-first SaaS, architected from
> day one for native mobile and a consumer booking marketplace.

This directory is the founding design package for SalonFlow. It is written to be read by an
engineering team and by investors. It is **design + architecture + a runnable data model**,
not a finished product — a production build competing with Fresha/Vagaro is a multi-team,
multi-quarter effort. What is here is enough to start building Monday morning and to brief a
seed investor.

## What's the working prototype?

A faithful, interactive **calendar + checkout screen** already lives in this repo at
[`/calendar`](../../src/app/calendar) (Next.js 16, React 19, Tailwind v4). It is the visual
north star for the scheduling surface described in `05-ux-and-flows.md` and proves the
front-end stack. It uses mock data; wiring it to the API in `04-api-and-auth.md` is the first
front-end milestone.

## The 18 requested outputs → where each lives

| # | Deliverable | Document |
|---|---|---|
| 1 | Product Requirements Document (PRD) | `01-prd.md` |
| 2 | Complete SaaS Architecture | `02-architecture.md` |
| 3 | Database Schema | `03-data-model.md` + `prisma/schema.prisma` |
| 4 | Entity Relationship Diagram | `03-data-model.md` (Mermaid ERD) |
| 5 | API Design | `04-api-and-auth.md` |
| 6 | Authentication Design | `04-api-and-auth.md` |
| 7 | Multi-Tenant Design | `02-architecture.md` (§Multi-tenancy) |
| 8 | UI/UX Wireframes | `05-ux-and-flows.md` |
| 9 | Admin Dashboard Design | `05-ux-and-flows.md` (§Admin) + `/calendar` prototype |
| 10 | Customer Booking Flow | `05-ux-and-flows.md` (§Booking flow) |
| 11 | Mobile App Architecture | `02-architecture.md` (§Mobile / API-first) |
| 12 | Marketplace Architecture | `02-architecture.md` (§Marketplace) |
| 13 | AI Assistant Architecture | `06-ai-assistant.md` |
| 14 | Development Roadmap | `07-roadmap-costs-pitch.md` |
| 15 | MVP Definition | `01-prd.md` (§MVP) |
| 16 | Cost Estimation | `07-roadmap-costs-pitch.md` |
| 17 | Monetization Strategy | `07-roadmap-costs-pitch.md` |
| 18 | Investor Pitch Summary | `07-roadmap-costs-pitch.md` |

## North-star decisions (the CTO's calls)

These are the load-bearing choices the rest of the package assumes. They are decisions, not
options — change them deliberately.

1. **Modular monolith first, not microservices.** One deployable NestJS app with strict
   internal module boundaries + an event bus. Extract services only when a module's scaling
   or team ownership demands it. Microservices on day one would kill the "10-minute setup,
   ship fast" thesis.
2. **Postgres row-level security (RLS) is the tenant firewall.** Every tenant-owned table
   carries `salon_id`; RLS policies enforce isolation at the database, not just the ORM. A
   bug in app code cannot leak across tenants.
3. **API-first, transport-agnostic.** Web, iOS, and Android are all clients of the same
   versioned REST+webhook API. No business logic in the Next.js app — it calls the API like
   any other client. This is what makes Phases 2–4 additive instead of rewrites.
4. **Event-driven core via an outbox + queue.** Domain events (`appointment.booked`,
   `payment.captured`) are written transactionally to an outbox and relayed to BullMQ
   (Redis). Notifications, calendar sync, loyalty, and analytics are all async consumers.
   This is also the marketplace and mobile-push backbone.
5. **AI assistant is a tool-using Claude agent over the same API.** It does not get its own
   database access; it calls the same authorized endpoints a receptionist would, so
   permissions and tenant isolation come for free. See `06-ai-assistant.md`.
6. **Calendar sync is the wedge.** Two-way, real-time sync with Google/Microsoft/Apple is
   the single most-defensible feature and the hardest to copy. It gets first-class
   architectural treatment, not a bolt-on.

## Stack (as specified, with rationale)

Frontend: Next.js + TypeScript + Tailwind + shadcn/ui · Backend: NestJS · DB: PostgreSQL ·
Cache/queue: Redis (+ BullMQ) · Storage: AWS S3 · Auth: Clerk · Payments: Stripe (Connect) ·
Comms: Twilio (SMS/WhatsApp) + Resend (email) · Calendar: Microsoft Graph, Google Calendar
API, CalDAV (Apple) · AI: Claude (Anthropic) · Hosting: AWS (ECS Fargate + RDS + ElastiCache).

See `02-architecture.md` for why each was chosen and where the seams are.
