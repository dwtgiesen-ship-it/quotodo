-- Quotodo Slice A — Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- Tables
-- ============================================

create table public.users (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  address text not null,
  postal_code text default '',
  city text default '',
  country text not null default 'NL',
  vat_number text not null,
  iban text not null,
  phone text default '',
  email text default '',
  website text default '',
  logo_url text,
  brand_color_primary text,
  brand_color_secondary text,
  default_payment_terms integer not null default 30,
  default_quote_validity integer not null default 30,
  default_currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint companies_user_id_unique unique (user_id)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_number text not null,
  client_name text not null default '',
  client_email text default '',
  title text not null default 'Untitled Quote',
  summary text default '',
  scope_included jsonb not null default '[]'::jsonb,
  scope_excluded jsonb not null default '[]'::jsonb,
  timeline text default '',
  status text not null default 'draft' check (status in ('draft', 'final')),
  subtotal integer not null default 0,
  vat_amount integer not null default 0,
  total integer not null default 0,
  currency text not null default 'EUR',
  valid_until date,
  payment_terms integer not null default 30,
  notes text default '',
  original_input text not null default '',
  ai_raw_response jsonb,
  ai_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null default '',
  quantity numeric not null default 1,
  unit text not null default 'per stuk',
  unit_price integer not null default 0,
  vat_rate numeric not null default 21,
  line_total integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- Quote number auto-generation
-- ============================================

create or replace function public.generate_quote_number(p_company_id uuid)
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
        split_part(quote_number, '-', 3),
        ''
      )::integer
    ),
    0
  ) + 1
  into next_seq
  from public.quotes
  where company_id = p_company_id
    and quote_number like 'QT-' || current_year || '-%';

  return 'QT-' || current_year || '-' || lpad(next_seq::text, 3, '0');
end;
$$;

-- ============================================
-- Auto-create user record on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Auto-update updated_at
-- ============================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;

-- Users: can only read/update own row
create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);

-- Companies: scoped to user_id
create policy "Users can read own company"
  on public.companies for select
  using (user_id = auth.uid());

create policy "Users can insert own company"
  on public.companies for insert
  with check (user_id = auth.uid());

create policy "Users can update own company"
  on public.companies for update
  using (user_id = auth.uid());

-- Quotes: scoped to company_id via companies
create policy "Users can read own quotes"
  on public.quotes for select
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can insert own quotes"
  on public.quotes for insert
  with check (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can update own quotes"
  on public.quotes for update
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

create policy "Users can delete own quotes"
  on public.quotes for delete
  using (
    company_id in (
      select id from public.companies where user_id = auth.uid()
    )
  );

-- Quote line items: scoped via quote → company
create policy "Users can read own line items"
  on public.quote_line_items for select
  using (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy "Users can insert own line items"
  on public.quote_line_items for insert
  with check (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy "Users can update own line items"
  on public.quote_line_items for update
  using (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

create policy "Users can delete own line items"
  on public.quote_line_items for delete
  using (
    quote_id in (
      select q.id from public.quotes q
      join public.companies c on q.company_id = c.id
      where c.user_id = auth.uid()
    )
  );

-- ============================================
-- Indexes
-- ============================================

create index idx_companies_user_id on public.companies(user_id);
create index idx_quotes_company_id on public.quotes(company_id);
create index idx_quotes_status on public.quotes(status);
create index idx_quote_line_items_quote_id on public.quote_line_items(quote_id);
