-- =============================================================
-- Swells Lab — Supabase Schema + RLS
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- TABLES
-- =============================================================

create table if not exists clients (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  accent_color  text,
  onboarded_at  date,
  created_at    timestamptz default now() not null
);

-- Maps Supabase auth users → clients (one client can have multiple users)
create table if not exists client_users (
  id         uuid primary key default uuid_generate_v4(),
  client_id  uuid not null references clients(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique(client_id, user_id)
);

create table if not exists galleries (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  title           text not null,
  slug            text not null,
  shoot_date      date,
  location        text,
  lens            text,
  description     text,
  cover_photo_id  uuid,  -- FK set after photos are inserted
  published       boolean default false not null,
  display_order   integer default 0 not null,
  created_at      timestamptz default now() not null,
  unique(client_id, slug)
);

create table if not exists photos (
  id            uuid primary key default uuid_generate_v4(),
  gallery_id    uuid not null references galleries(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  storage_path  text not null,    -- relative path inside 'photos' bucket
  width         integer not null,
  height        integer not null,
  caption       text,
  display_order integer default 0 not null,
  created_at    timestamptz default now() not null
);

-- Add deferred FK for cover_photo_id now that photos table exists
alter table galleries
  add constraint galleries_cover_photo_id_fkey
  foreign key (cover_photo_id) references photos(id)
  on delete set null;

create table if not exists documents (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid not null references clients(id) on delete cascade,
  title          text not null,
  storage_path   text not null,   -- relative path inside 'documents' bucket
  document_type  text not null default 'other'
                 check (document_type in ('contract','proposal','report','other')),
  created_at     timestamptz default now() not null
);

create table if not exists invoices (
  id                   uuid primary key default uuid_generate_v4(),
  client_id            uuid not null references clients(id) on delete cascade,
  title                text not null,
  amount               numeric(12,2) not null,
  currency             text not null default 'MXN',
  status               text not null default 'draft'
                       check (status in ('draft','sent','paid','overdue')),
  due_date             date,
  paid_at              timestamptz,
  stripe_invoice_id    text,
  stripe_payment_url   text,
  created_at           timestamptz default now() not null
);

-- =============================================================
-- INDEXES
-- =============================================================

create index if not exists idx_client_users_user_id   on client_users(user_id);
create index if not exists idx_client_users_client_id on client_users(client_id);
create index if not exists idx_galleries_client_id    on galleries(client_id);
create index if not exists idx_photos_gallery_id      on photos(gallery_id);
create index if not exists idx_photos_client_id       on photos(client_id);
create index if not exists idx_invoices_client_id     on invoices(client_id);
create index if not exists idx_documents_client_id    on documents(client_id);

-- =============================================================
-- STORAGE BUCKETS
-- =============================================================

insert into storage.buckets (id, name, public)
values
  ('photos',    'photos',    true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Helper: returns the client_id for the current authenticated user
create or replace function auth.client_id()
returns uuid
language sql stable
security definer
as $$
  select client_id
  from client_users
  where user_id = auth.uid()
  limit 1;
$$;

-- clients
alter table clients enable row level security;

create policy "clients: own row" on clients
  for select using (id = auth.client_id());

-- client_users
alter table client_users enable row level security;

create policy "client_users: own rows" on client_users
  for select using (user_id = auth.uid());

-- galleries
alter table galleries enable row level security;

create policy "galleries: own client" on galleries
  for select using (client_id = auth.client_id() and published = true);

-- photos
alter table photos enable row level security;

create policy "photos: own client" on photos
  for select using (client_id = auth.client_id());

-- documents
alter table documents enable row level security;

create policy "documents: own client" on documents
  for select using (client_id = auth.client_id());

-- invoices
alter table invoices enable row level security;

create policy "invoices: own client" on invoices
  for select using (client_id = auth.client_id());

-- Storage: photos bucket (public read, authenticated upload via service role)
create policy "photos: public read" on storage.objects
  for select using (bucket_id = 'photos');

-- Storage: documents bucket (only authenticated users belonging to the client)
create policy "documents: client read" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );
