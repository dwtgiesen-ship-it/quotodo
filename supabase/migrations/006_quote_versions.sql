-- Quotodo — Quote versioning
-- Run this in the Supabase SQL Editor

-- Version snapshots
create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version_number integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (quote_id, version_number)
);

create index idx_quote_versions_quote_id on public.quote_versions(quote_id);

-- Current version pointer on quotes
alter table public.quotes
  add column if not exists current_version integer not null default 1;

-- RLS
alter table public.quote_versions enable row level security;

create policy "Users can read own quote versions"
  on public.quote_versions for select
  using (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy "Users can insert own quote versions"
  on public.quote_versions for insert
  with check (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

-- Backfill v1 for all existing quotes
insert into public.quote_versions (quote_id, version_number, data)
select
  q.id,
  1,
  jsonb_build_object(
    'title', q.title,
    'summary', q.summary,
    'client_name', q.client_name,
    'client_email', q.client_email,
    'scope_included', q.scope_included,
    'scope_excluded', q.scope_excluded,
    'timeline', q.timeline,
    'subtotal', q.subtotal,
    'vat_amount', q.vat_amount,
    'total', q.total,
    'currency', q.currency,
    'payment_terms', q.payment_terms,
    'notes', q.notes,
    'line_items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'description', li.description,
            'quantity', li.quantity,
            'unit', li.unit,
            'unit_price', li.unit_price,
            'vat_rate', li.vat_rate,
            'line_total', li.line_total
          )
          order by li.sort_order
        )
        from public.quote_line_items li
        where li.quote_id = q.id
      ),
      '[]'::jsonb
    )
  )
from public.quotes q
where not exists (
  select 1 from public.quote_versions qv where qv.quote_id = q.id
);
