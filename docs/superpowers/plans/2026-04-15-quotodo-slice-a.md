# Quotodo Slice A — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Paste client communication → AI-generated quote → edit → branded PDF.

---

## Phase 1: Setup

- [ ] 1.1 — `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` dir
- [ ] 1.2 — Install deps: `@supabase/supabase-js @supabase/ssr @anthropic-ai/sdk @react-pdf/renderer zod`
- [ ] 1.3 — Init shadcn/ui, add components: button, input, textarea, card, badge, toast, skeleton, table, label, separator
- [ ] 1.4 — Set up `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- [ ] 1.5 — Create `src/types/index.ts` — all TypeScript types matching DB schema
- [ ] 1.6 — Create `src/lib/validations.ts` — all Zod schemas (company, quote, quote AI response, line item)
- [ ] 1.7 — Create `src/lib/utils.ts` — `calculateLineTotal`, `calculateLineVAT`, `calculateQuoteTotals`, `formatCents`, `formatDate`
- [ ] 1.8 — Write tests for utils (`__tests__/lib/utils.test.ts`)
- [ ] 1.9 — Create Supabase SQL migration: all tables, RLS policies, quote number function
- [ ] 1.10 — Create `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server)
- [ ] 1.11 — Create `src/middleware.ts` + `src/lib/supabase/middleware.ts` — protect `/app/*`, redirect unauthenticated → `/login`, no company → `/onboarding`
- [ ] 1.12 — Commit: "feat: project setup, types, utils, supabase config"

## Phase 2: Auth + Onboarding

- [ ] 2.1 — Create `src/app/(auth)/login/page.tsx` — email input + "Send magic link" button
- [ ] 2.2 — Create `src/app/(auth)/callback/route.ts` — Supabase auth callback, exchange code for session
- [ ] 2.3 — Create `src/lib/actions/companies.ts` — `createCompany`, `getCompany`, `updateCompany`
- [ ] 2.4 — Create `src/app/onboarding/page.tsx` — form: company name, address, BTW-nummer, IBAN → calls `createCompany` → redirects to `/app/dashboard`
- [ ] 2.5 — Create `src/app/(app)/layout.tsx` — sidebar (Dashboard, Settings), topbar (email, logout)
- [ ] 2.6 — Create `src/components/layout/sidebar.tsx` + `src/components/layout/topbar.tsx`
- [ ] 2.7 — Create `src/app/(app)/settings/page.tsx` — edit company details (same fields as onboarding)
- [ ] 2.8 — Commit: "feat: auth, onboarding, app layout, settings"

## Phase 3: Core Flow (paste → AI → editor → save)

- [ ] 3.1 — Create `src/lib/ai.ts` — `generateQuote(input)`: system prompt, Claude API call, 30s timeout, Zod validation, retry once, fallback skeleton, rate limit check (10/hr)
- [ ] 3.2 — Write tests for AI module (mock SDK, test timeout/retry/validation paths)
- [ ] 3.3 — Create `src/lib/actions/quotes.ts` — `createQuote`, `updateQuote`, `getQuote`, `listQuotes`, `generateQuoteNumber`
- [ ] 3.4 — Create `src/components/quotes/paste-input.tsx` — textarea + submit + loading state + error with retry (preserves input)
- [ ] 3.5 — Create `src/app/(app)/quotes/new/page.tsx` — paste-input → calls AI → saves draft → redirects to `/app/quotes/[id]`
- [ ] 3.6 — Create quote editor sub-components:
  - `src/components/quotes/quote-header-fields.tsx` (title, client name/email, valid_until)
  - `src/components/quotes/line-items-table.tsx` (add/remove/edit rows, inline editing)
  - `src/components/quotes/quote-scope-fields.tsx` (scope included/excluded as editable lists)
  - `src/components/quotes/quote-terms-fields.tsx` (timeline, payment terms, notes)
  - `src/components/quotes/quote-totals.tsx` (computed subtotal, VAT, total — read-only display)
- [ ] 3.7 — Create `src/components/quotes/quote-editor.tsx` — orchestrates sub-components, debounced auto-save, "last saved" indicator, "Mark as Final" button
- [ ] 3.8 — Create `src/app/(app)/quotes/[id]/page.tsx` — loads quote, renders editor
- [ ] 3.9 — Commit: "feat: AI generation, quote editor, paste-to-quote flow"

## Phase 4: Dashboard + PDF

- [ ] 4.1 — Create `src/components/quotes/quote-list.tsx` — table with status badges, click to open editor
- [ ] 4.2 — Create `src/app/(app)/dashboard/page.tsx` — "New Quote" CTA, draft/final counts, quote list
- [ ] 4.3 — Create `src/lib/pdf.ts` — `renderQuotePDF(quote, lineItems, company)`: branded layout with company details, line items table, VAT breakdown, footer with payment terms/IBAN
- [ ] 4.4 — Create `src/app/api/pdf/quote/[id]/route.ts` — auth + ownership check, fetch quote + company, call renderer, stream PDF response
- [ ] 4.5 — Add "Preview PDF" button to quote editor → opens `/api/pdf/quote/[id]` in new tab
- [ ] 4.6 — Add error boundary (`src/app/(app)/error.tsx`) + loading skeletons for dashboard and editor
- [ ] 4.7 — Commit: "feat: dashboard, PDF generation, error handling"
- [ ] 4.8 — Manual smoke test: login → onboard → paste → edit → PDF → verify
