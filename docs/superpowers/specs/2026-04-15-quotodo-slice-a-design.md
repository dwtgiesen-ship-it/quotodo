# Quotodo — Slice A Design Spec

## Overview

Quotodo is a SaaS tool that turns client communication (emails, WhatsApp messages, meeting notes) into professional quotes ("offertes") for Dutch SMEs. Slice A is the thinnest vertical slice: paste messy text, get a structured quote, edit it, export as branded PDF.

**Target:** 2–5 invited pilot users (magic link auth, no public signup).
**Core bet:** "Paste → useful quote in seconds" is valuable enough to build around.

## Scope

What ships:
1. Magic link authentication (Supabase Auth)
2. One-step onboarding: company name, address, BTW-nummer, IBAN
3. Paste client communication → AI generates structured quote draft
4. Form-based quote editor (header, line items, scope, timeline, terms)
5. "Preview PDF" button → real branded PDF opens in new tab
6. Quote list on dashboard with draft/final counts

What does NOT ship:
- Clients database (client info stored directly on quote)
- Product/service library
- Public share links
- Email sending
- Invoicing
- Stripe billing
- Brand colors/logo upload (deferred to settings, not required)
- Landing page
- Google OAuth
- Live PDF preview sidebar
- Analytics/stats beyond simple counts

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes + Server Actions
- **Database:** PostgreSQL via Supabase (Auth, Database)
- **AI:** Anthropic Claude API via `@anthropic-ai/sdk` (claude-sonnet-4-6)
- **PDF:** `@react-pdf/renderer` (server-side)
- **Deployment:** Vercel
- **Validation:** Zod for all inputs and AI output
- **Storage:** Supabase Storage (not used in slice A, reserved for logo upload later)

## Architecture Decisions

- **Auth:** Supabase magic link only. No Google OAuth in slice A.
- **Multi-tenancy:** RLS from day one. Every row scoped to `company_id`.
- **Rendering:** Server Components by default. Client Components only for interactive forms.
- **UI language:** English. Generated quote content matches input language (Dutch in → Dutch out).
- **Money:** All monetary values stored as integer cents. Formatted on display. No floating point.
- **VAT:** Default 21% per line item (NL standard). User can edit to 9% or 0% per line.

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | References auth.users |
| email | text | |
| full_name | text | |
| created_at | timestamptz | |

### companies
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → users | |
| company_name | text | Required at onboarding |
| address | text | Required at onboarding |
| postal_code | text | |
| city | text | |
| country | text | Default "NL" |
| vat_number | text | Required at onboarding (BTW-nummer) |
| iban | text | Required at onboarding |
| phone | text | |
| email | text | |
| website | text | |
| logo_url | text | Nullable, deferred |
| brand_color_primary | text | Nullable, deferred |
| brand_color_secondary | text | Nullable, deferred |
| default_payment_terms | integer | Default 30 (days) |
| default_quote_validity | integer | Default 30 (days) |
| default_currency | text | Default "EUR" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### quotes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| company_id | FK → companies | |
| quote_number | text | Auto-generated server-side per company: "QT-2026-001" |
| client_name | text | Stored directly, no clients table |
| client_email | text | |
| title | text | |
| summary | text | |
| scope_included | jsonb | Array of strings |
| scope_excluded | jsonb | Array of strings |
| timeline | text | |
| status | text | "draft" or "final" |
| subtotal | integer | Cents |
| vat_amount | integer | Cents |
| total | integer | Cents |
| currency | text | Default "EUR" |
| valid_until | date | |
| payment_terms | integer | Days |
| notes | text | |
| original_input | text | The pasted communication |
| ai_raw_response | jsonb | Raw Claude output for debugging |
| ai_edited | boolean | Default false, set true on first user edit |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### quote_line_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| quote_id | FK → quotes | |
| description | text | |
| quantity | numeric | |
| unit | text | e.g. "per stuk", "per uur" |
| unit_price | integer | Cents |
| vat_rate | numeric | Default 21 |
| line_total | integer | Cents, excl. VAT |
| sort_order | integer | |
| created_at | timestamptz | |

Quote number auto-increments per company via a Postgres function.

## Data Flow — Paste to Quote

```
User pastes text → Client Component (textarea + submit)
  → Server Action: validateInput(text) via Zod (min 10 chars, max 10k)
  → Server Action calls lib/ai.ts generateQuote(text)
    → Claude API with system prompt + user text
    → 30-second timeout via AbortController
    → Response parsed + validated against Zod QuoteAIResponseSchema
    → If validation fails: retry once with error details appended
    → If second failure: return fallback skeleton (empty strings, empty arrays, no nulls)
  → Return structured quote draft to client
  → Client renders quote editor form, pre-filled with AI output
  → User edits → ai_edited flag set to true
  → "Save Draft" → Server Action upserts quote + line items (status: draft)
  → "Preview PDF" → GET /api/pdf/quote/[id] → streams PDF → opens in new tab
  → "Mark as Final" → sets status to final
```

### AI Module (`lib/ai.ts`)

- `generateQuote(input: string): Promise<QuoteAIResponse>` — single entry point
- System prompt instructs Claude to return JSON matching the Zod schema
- Response validated with `QuoteAIResponseSchema.safeParse()`
- On parse failure: one retry with error details appended to prompt
- On second failure: return fallback skeleton structure
- Stores raw AI response in `ai_raw_response` for quality debugging
- 30-second timeout via AbortController
- All failures logged with input length + error type (no PII)

### PDF Module (`lib/pdf.ts`)

- `renderQuotePDF(quote, company): Promise<Buffer>` — pure function
- Takes fully structured data, knows nothing about DB or AI
- Route handler `/api/pdf/quote/[id]` fetches data, verifies ownership, calls renderer, streams response

### VAT Calculation (`lib/utils.ts`)

- `calculateLineTotal(quantity, unitPrice): number` — line total excl. VAT
- `calculateLineVAT(lineTotal, vatRate): number` — VAT per line
- `calculateQuoteTotals(lineItems): { subtotal, vatAmount, total }` — aggregates
- All operate on integer cents

### Server Actions (`lib/actions/`)

- Thin actions layer between components and database
- All actions return `{ success: boolean, data?: T, error?: string }` — never throw to client
- Actions handle auth checks, Zod validation, DB operations

## Pages & Routes

```
/login                    → Magic link auth
/onboarding               → Company details (name, address, BTW, IBAN)
/app/dashboard            → Quote list + "New Quote" CTA + draft/final counts
/app/quotes/new           → Paste textarea → AI generates → redirect to editor
/app/quotes/[id]          → Quote editor form
/app/settings             → Edit company details
/api/pdf/quote/[id]       → PDF generation (auth + ownership check)
/auth/callback            → Supabase auth callback
```

**Middleware:** `middleware.ts` checks Supabase session on `/app/*`. Unauthenticated → `/login`. Authenticated but no company → `/onboarding`.

**Layout:** `/app` routes share a layout with minimal sidebar (Dashboard, Settings) and top bar (user email, logout).

## File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/callback/route.ts
│   ├── onboarding/page.tsx
│   ├── (app)/layout.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/quotes/new/page.tsx
│   ├── (app)/quotes/[id]/page.tsx
│   ├── (app)/settings/page.tsx
│   └── api/pdf/quote/[id]/route.ts
├── components/
│   ├── ui/                            ← shadcn
│   ├── quotes/
│   │   ├── paste-input.tsx            ← textarea + submit
│   │   ├── quote-editor.tsx           ← orchestrates editor sections
│   │   ├── quote-header-fields.tsx    ← title, client, dates
│   │   ├── line-items-table.tsx       ← editable line items
│   │   ├── quote-scope-fields.tsx     ← scope included/excluded
│   │   ├── quote-terms-fields.tsx     ← timeline, payment terms, notes
│   │   ├── quote-totals.tsx           ← subtotal, VAT, total display
│   │   └── quote-list.tsx             ← dashboard list
│   └── layout/
│       ├── sidebar.tsx
│       └── topbar.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── supabase/middleware.ts
│   ├── actions/
│   │   ├── quotes.ts                  ← quote CRUD server actions
│   │   └── companies.ts              ← company CRUD server actions
│   ├── ai.ts                          ← generateQuote + system prompt
│   ├── pdf.ts                         ← renderQuotePDF
│   ├── utils.ts                       ← VAT calc, formatting, cents helpers
│   └── validations.ts                ← all Zod schemas
├── types/index.ts
└── middleware.ts
```

## Error Handling

### AI Pipeline
- 30-second timeout on Claude API calls (AbortController)
- On timeout/network error: user-friendly message with retry button, original input preserved in textarea
- On Zod validation failure: one auto-retry, then fallback skeleton (no nulls)
- Explicit "Retry" button on failure — re-submits the same input, no re-typing needed
- Basic rate limiting: max 10 AI generations per user per hour (server-side check)
- Log all failures with input length + error type (no PII)

### Auth
- Expired magic link: "Link expired" with resend button
- Session expired mid-use: middleware redirects to `/login`, return URL preserved

### Quote Editor
- Debounced auto-save on draft quotes (Server Action, no page reload)
- "Last saved" timestamp indicator in editor (e.g. "Last saved 2 minutes ago"), updates on each successful save
- Save failure: toast notification with retry, data stays in form state (no data loss)
- Prevent "Mark as Final" if no line items or any unit_price is 0

### PDF
- Ownership check: query by `id` AND `company_id` matching session user's company
- Not found / unauthorized: 404
- Render failure: 500, logged server-side

### General
- React Error Boundary wrapping `/app` layout
- Skeleton loading states for dashboard list and quote editor
- All Server Actions return `{ success, data?, error? }` — never throw to client

## Design Direction

Clean, modern SaaS aesthetic (Linear/Stripe-inspired):
- Geist font family
- Subtle animations, spacious layout, generous whitespace
- Cards with subtle borders, no heavy shadows
- Status badges (draft = gray, final = green)
- Skeleton loaders, no full-page spinners
- Dark/light mode via Tailwind + shadcn
- Mobile-responsive from the start

## Prerequisites (before coding)

1. Create Supabase project (user does this manually)
2. Get Anthropic API key (user does this manually)
3. Set up environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
