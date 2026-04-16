-- Quotodo — Deposit payments
-- Run this in the Supabase SQL Editor

alter table public.invoices
  add column if not exists deposit_required_percent integer not null default 30
    check (deposit_required_percent >= 0 and deposit_required_percent <= 100),
  add column if not exists deposit_amount integer not null default 0,
  add column if not exists deposit_paid boolean not null default false,
  add column if not exists deposit_paid_at timestamptz;

-- Company-level default deposit percent (user can override per quote later)
alter table public.companies
  add column if not exists default_deposit_percent integer not null default 30
    check (default_deposit_percent >= 0 and default_deposit_percent <= 100);
