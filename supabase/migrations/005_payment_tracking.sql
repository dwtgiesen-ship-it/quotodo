-- Quotodo — Payment tracking upgrade
-- Run this in the Supabase SQL Editor

alter table public.invoices
  add column if not exists payment_reference text,
  add column if not exists payment_method text check (
    payment_method is null
    or payment_method in ('bank_transfer', 'cash', 'other')
  );
