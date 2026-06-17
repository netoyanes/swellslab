-- =============================================================
-- Swells Lab — PHASE 5 (App Fase 3): Cotizaciones → Facturas → Recibos
-- Run ONCE in Supabase SQL Editor. Idempotent & incremental.
-- =============================================================

-- ---- 1. quotes (cotizaciones) -------------------------------
create table if not exists quotes (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid references clients(id) on delete set null,
  brand_id      uuid references brands(id) on delete set null,
  number        text unique,                       -- COT-2026-001
  title         text not null,
  status        text not null default 'draft'
                  check (status in ('draft','sent','accepted','rejected','expired')),
  currency      text not null default 'MXN',
  notes         text,
  valid_until   date,
  subtotal      numeric(12,2) not null default 0,
  tax_rate      numeric(5,2)  not null default 0,   -- e.g. 16.00 (IVA)
  tax_amount    numeric(12,2) not null default 0,
  total         numeric(12,2) not null default 0,
  share_token   uuid,                              -- public accept link
  accepted_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create table if not exists quote_items (
  id            uuid primary key default uuid_generate_v4(),
  quote_id      uuid not null references quotes(id) on delete cascade,
  description   text not null,
  qty           numeric(12,2) not null default 1,
  unit_price    numeric(12,2) not null default 0,
  amount        numeric(12,2) not null default 0,
  display_order integer not null default 0
);

-- ---- 2. invoices (extend existing table) --------------------
alter table invoices add column if not exists brand_id    uuid references brands(id) on delete set null;
alter table invoices add column if not exists quote_id    uuid references quotes(id) on delete set null;
alter table invoices add column if not exists number      text;
alter table invoices add column if not exists notes       text;
alter table invoices add column if not exists subtotal    numeric(12,2) not null default 0;
alter table invoices add column if not exists tax_rate    numeric(5,2)  not null default 0;
alter table invoices add column if not exists tax_amount  numeric(12,2) not null default 0;
alter table invoices add column if not exists issued_at   timestamptz;
alter table invoices add column if not exists updated_at  timestamptz default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_number_key') then
    alter table invoices add constraint invoices_number_key unique (number);
  end if;
end $$;

create table if not exists invoice_items (
  id            uuid primary key default uuid_generate_v4(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  description   text not null,
  qty           numeric(12,2) not null default 1,
  unit_price    numeric(12,2) not null default 0,
  amount        numeric(12,2) not null default 0,
  display_order integer not null default 0
);

-- ---- 3. receipts (recibos / comprobantes de pago) -----------
create table if not exists receipts (
  id            uuid primary key default uuid_generate_v4(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  client_id     uuid references clients(id) on delete set null,
  number        text unique,                       -- REC-2026-001
  amount        numeric(12,2) not null,
  currency      text not null default 'MXN',
  method        text,                              -- card, transfer, cash, stripe
  paid_at       timestamptz default now() not null,
  stripe_payment_intent text,
  created_at    timestamptz default now() not null
);

-- ---- 4. Indexes ---------------------------------------------
create index if not exists idx_quotes_client     on quotes(client_id);
create index if not exists idx_quotes_status      on quotes(status);
create index if not exists idx_quote_items_quote  on quote_items(quote_id);
create index if not exists idx_invoices_client    on invoices(client_id);
create index if not exists idx_invoice_items_inv  on invoice_items(invoice_id);
create index if not exists idx_receipts_invoice   on receipts(invoice_id);
create index if not exists idx_receipts_client    on receipts(client_id);

-- ---- 5. RLS (disabled, app + middleware guard) --------------
alter table quotes        disable row level security;
alter table quote_items   disable row level security;
alter table invoice_items disable row level security;
alter table receipts      disable row level security;
