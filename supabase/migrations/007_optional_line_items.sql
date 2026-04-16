-- Quotodo — Interactive modular quotes
-- Run this in the Supabase SQL Editor

-- Add optional flag columns to quote_line_items (existing items default to non-optional, selected)
alter table public.quote_line_items
  add column if not exists optional boolean not null default false,
  add column if not exists default_selected boolean not null default true;

-- On quotes, track what the client selected when they accepted
alter table public.quotes
  add column if not exists accepted_selection jsonb,
  add column if not exists accepted_total integer;

comment on column public.quotes.accepted_selection is
  'Array of line item IDs the client selected when accepting. NULL if quote is not accepted or had no optional items.';
comment on column public.quotes.accepted_total is
  'Snapshot of total in cents based on client selection at accept time.';
