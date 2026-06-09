# 06 — AI Assistant Architecture

The assistant turns the dashboard into a conversation: *"Book Sarah next Tuesday for gel
nails."* · *"Move Friday's appointments to Saturday."* · *"Show customers who haven't booked
in 60 days."* · *"Fill empty slots next week."* · *"How much revenue did we make last
month?"* · *"Generate a promotion for slow weekdays."*

## 1. Core design decision

**The assistant is a tool-using Claude agent that calls the same `/v1` API a human would —
not a text-to-SQL bot with database access.** Consequences:

- **Security & multi-tenancy for free.** The agent acts *on behalf of the signed-in user*,
  using their token. Every action runs through the same `AuthGuard` + `RolesGuard` + RLS as
  a manual click. The model literally cannot read another salon's data or perform an action
  the user isn't allowed to.
- **No new write paths.** "Book an appointment" calls `POST /v1/appointments` — same
  validation, conflict-checking, idempotency, and outbox events as the UI. The AI gets the
  no-double-booking guarantees for free.
- **Auditable.** Every tool call is logged to `AuditLog` with the actor and a `traceId`.

## 2. Models (Anthropic Claude)

We use a tiered routing strategy. Model IDs and list prices (per million tokens):

| Role | Model | Model ID | Price (in / out) |
|---|---|---|---|
| Intent routing / classification / quick lookups | Claude Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 |
| Default assistant (NL → tool calls, analytics Q&A, copy) | Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 |
| Complex multi-step automations (bulk reschedule, "fill the week", campaign planning) | Claude Opus 4.8 | `claude-opus-4-8` | $5 / $25 |

- **Default to Sonnet 4.6** for the interactive assistant — best quality/cost balance for
  tool-use + reasoning. Route trivial classifications to Haiku; escalate genuinely
  multi-step/destructive planning to Opus 4.8.
- **Adaptive thinking** (`thinking: {type: "adaptive"}`) on Sonnet/Opus so the model decides
  how hard to think per request; set `output_config.effort` per route (`low` for lookups,
  `high` for planning).
- **Streaming** responses to the dashboard over SSE (`POST /v1/assistant/messages`).
- **Prompt caching** on the stable system prompt + tool schemas + the salon's service/staff
  catalog snapshot — these repeat every turn, so caching cuts cost ~10× on the prefix. Keep
  volatile context (today's date, the user's question) after the cache breakpoint.

## 3. Tool surface (the agent's hands)

Tools are thin wrappers over `/v1` endpoints, defined with strict JSON schemas. Read tools
are auto-approved; **write/destructive tools require an in-UI confirmation step** (the
assistant proposes, the user taps "Confirm").

```
Read  (auto):   search_customers, get_schedule, find_availability,
                get_revenue_report, get_staff_performance, list_inactive_customers,
                get_service_catalog
Write (confirm): create_appointment, reschedule_appointment, cancel_appointment,
                create_campaign, send_message, create_promotion, fill_empty_slots
```

Example tool (strict schema, maps 1:1 to the API):

```jsonc
{
  "name": "create_appointment",
  "description": "Book an appointment. Call when the user asks to book/schedule a client. Always confirm date, time, service, and staff back to the user before calling.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customerId": { "type": "string" },
      "serviceId":  { "type": "string" },
      "staffId":    { "type": "string" },
      "start":      { "type": "string", "format": "date-time" }
    },
    "required": ["customerId", "serviceId", "staffId", "start"],
    "additionalProperties": false
  }
}
```

**Tool descriptions are prescriptive about *when* to call** (recent Claude models reach for
tools conservatively — the trigger condition in the description materially improves
call-rate). For large tool sets we can enable **tool search** so only relevant schemas load
per turn, preserving the prompt cache.

## 4. Request lifecycle

```
User: "Book Sarah next Tuesday for gel nails with Andre at 2pm"
  │
  ▼  POST /v1/assistant/messages  (user's JWT, salon scoped)
NestJS AI module
  │ 1. Build system prompt + cached catalog context (services, staff, hours)
  │ 2. Claude (Sonnet 4.6) plans:
  │      search_customers("Sarah")  → resolves customerId (asks if ambiguous)
  │      get_service_catalog        → gel nails serviceId, duration
  │      find_availability(...)     → confirms 2pm Tue is free
  │ 3. Model returns a create_appointment tool call → UI shows a confirm card
  │ 4. User taps Confirm → tool executes POST /v1/appointments (Idempotency-Key)
  │ 5. Booking commits → outbox → confirmation SMS auto-sends
  ▼
Assistant: "Booked Sarah Lewis for Gel Nails with Andre, Tue 19 Aug 2:00–3:00pm.
            A confirmation text is on its way."
```

Each tool result returns to the model; it loops until done, then streams a natural-language
summary. Ambiguity ("which Sarah?") is surfaced as a clarifying question, not a guess.

## 5. Proactive intelligence (beyond chat)

The same tool layer powers **background insights**, generated by scheduled workers and
surfaced as dashboard cards with one-tap actions:

- *"12 clients haven't booked in 60 days — send a win-back offer?"* → `create_campaign`.
- *"Next Tuesday is 40% empty — promote a slow-day discount?"* → `create_promotion`.
- *"3 cancellations today match waitlist entries — auto-offer the slots?"* → `fill_empty_slots`.

These run on Opus 4.8 (multi-step planning) at low frequency, so cost stays modest while the
"it runs the salon for you" wow-factor is high.

## 6. Guardrails

- **Confirmation gate** on every write/destructive action (no silent bookings or sends).
- **Scoped tokens** — the agent can never exceed the acting user's role (a Staff member's
  assistant can't refund or edit pricing).
- **Idempotency** on all write tools — a retried tool call won't double-book or double-send.
- **Spend controls** — per-salon monthly AI budget; Haiku-first routing; prompt caching;
  `effort: low` for lookups. Hard cap with graceful "assistant paused for this month".
- **Auditability** — every tool call logged; the user can see exactly what the AI did.
- **No PII to training** — Anthropic API does not train on business data; sensitive fields
  (full card data never exists here — Stripe holds it) are out of scope by construction.
