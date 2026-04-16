-- Quotodo — Quote acceptance flow
-- Run this in the Supabase SQL Editor

-- Migrate existing 'final' statuses to 'draft' before changing constraint
update public.quotes set status = 'draft' where status = 'final';

-- Replace status check constraint with new valid values
alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in ('draft', 'sent', 'accepted', 'rejected'));

-- Add accepted_at timestamp (nullable)
alter table public.quotes
  add column if not exists accepted_at timestamptz;

-- Add rejected_at for symmetry (nullable)
alter table public.quotes
  add column if not exists rejected_at timestamptz;

-- Index on status for dashboard filtering (already exists from migration 001)
-- create index if not exists idx_quotes_status on public.quotes(status);
