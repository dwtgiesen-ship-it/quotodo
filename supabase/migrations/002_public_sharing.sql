-- Quotodo — Public quote sharing
-- Run this in the Supabase SQL Editor

-- Add public_id to quotes (auto-generated unique UUID)
alter table public.quotes
  add column public_id uuid not null default gen_random_uuid();

-- Unique constraint for lookups
alter table public.quotes
  add constraint quotes_public_id_unique unique (public_id);

-- Index for fast public lookups
create index idx_quotes_public_id on public.quotes(public_id);
