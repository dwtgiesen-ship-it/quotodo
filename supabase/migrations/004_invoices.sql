-- Quotodo — Invoices
-- Run this in the Supabase SQL Editor

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_number text not null,
  client_name text not null default '',
  client_email text default '',
  title text not null default '',
  notes text default '',
  line_items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  vat_amount integer not null default 0,
  total integer not null default 0,
  currency text not null default 'EUR',
  payment_terms integer not null default 30,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  issued_at date,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prevent duplicate invoices for the same quote
create unique index idx_invoices_quote_id_unique
  on public.invoices(quote_id)
  where quote_id is not null;

create index idx_invoices_company_id on public.invoices(company_id);
create index idx_invoices_status on public.invoices(status);

-- updated_at trigger
create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.update_updated_at();

-- Auto-generate invoice number per company per year
create or replace function public.generate_invoice_number(p_company_id uuid)
returns text
language plpgsql
as $$
declare
  next_seq integer;
  current_year text;
begin
  current_year := to_char(now(), 'YYYY');

  select coalesce(
    max(
      nullif(
        split_part(invoice_number, '-', 3),
        ''
      )::integer
    ),
    0
  ) + 1
  into next_seq
  from public.invoices
  where company_id = p_company_id
    and invoice_number like 'INV-' || current_year || '-%';

  return 'INV-' || current_year || '-' || lpad(next_seq::text, 3, '0');
end;
$$;

-- RLS
alter table public.invoices enable row level security;

create policy "Users can read own invoices"
  on public.invoices for select
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can update own invoices"
  on public.invoices for update
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can delete own invoices"
  on public.invoices for delete
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );
