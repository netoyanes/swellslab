-- =============================================================
-- Swells Lab — PHASE 2: Two-sided platform schema + RLS
-- =============================================================
-- Run ONCE in Supabase SQL Editor. This rebuilds the schema for
-- the admin/client platform. Safe to run over the Phase 1 seed
-- data (it drops and recreates). Re-seed with phase2-seed.sql.
-- =============================================================

-- ---- Teardown (Phase 1 + any prior Phase 2) -----------------
drop table if exists messages   cascade;
drop table if exists threads    cascade;
drop table if exists invoices   cascade;
drop table if exists assets      cascade;
drop table if exists photos      cascade;  -- Phase 1
drop table if exists documents   cascade;  -- Phase 1
drop table if exists galleries   cascade;
drop table if exists projects    cascade;
drop table if exists client_users cascade; -- Phase 1
drop table if exists clients     cascade;
drop table if exists profiles    cascade;

drop function if exists public.current_client_id() cascade; -- Phase 1
drop function if exists public.is_admin()      cascade;
drop function if exists public.my_client_id()  cascade;
drop function if exists public.handle_new_user() cascade;

create extension if not exists "uuid-ossp";

-- =============================================================
-- TABLES
-- =============================================================

-- profiles: one per auth user. role gates everything.
--   admin  -> studio owner, client_id null, full access
--   client -> belongs to exactly one client org via client_id
create table clients (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  accent_color  text,
  onboarded_at  date,
  created_at    timestamptz default now() not null
);

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'client' check (role in ('admin','client')),
  client_id   uuid references clients(id) on delete set null,
  created_at  timestamptz default now() not null
);

create table projects (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  title       text not null,
  slug        text not null,
  description text,
  status      text not null default 'active' check (status in ('active','archived')),
  created_at  timestamptz default now() not null,
  unique(client_id, slug)
);

create table galleries (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  title           text not null,
  slug            text not null,
  shoot_date      date,
  location        text,
  lens            text,
  description     text,
  cover_asset_id  uuid,
  published       boolean not null default false,
  display_order   integer not null default 0,
  created_at      timestamptz default now() not null,
  unique(client_id, slug)
);

-- assets: unified deliverables (image/video/pdf/doc)
create table assets (
  id            uuid primary key default uuid_generate_v4(),
  gallery_id    uuid references galleries(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  type          text not null default 'image' check (type in ('image','video','pdf','doc')),
  bucket        text not null default 'images',
  storage_path  text not null,
  width         integer,
  height        integer,
  duration      numeric,          -- seconds, for video
  caption       text,
  downloadable  boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz default now() not null
);

alter table galleries
  add constraint galleries_cover_asset_id_fkey
  foreign key (cover_asset_id) references assets(id) on delete set null;

create table invoices (
  id                 uuid primary key default uuid_generate_v4(),
  client_id          uuid not null references clients(id) on delete cascade,
  project_id         uuid references projects(id) on delete set null,
  title              text not null,
  amount             numeric(12,2) not null,
  currency           text not null default 'MXN',
  status             text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  due_date           date,
  paid_at            timestamptz,
  stripe_invoice_id  text,
  stripe_payment_url text,
  created_at         timestamptz default now() not null
);

-- threads: a conversation scoped to a project, gallery, or single asset
create table threads (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  gallery_id  uuid references galleries(id) on delete cascade,
  asset_id    uuid references assets(id) on delete cascade,
  kind        text not null default 'project' check (kind in ('project','gallery','asset')),
  created_at  timestamptz default now() not null
);

create table messages (
  id           uuid primary key default uuid_generate_v4(),
  thread_id    uuid not null references threads(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  author_role  text not null check (author_role in ('admin','client')),
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz default now() not null
);

-- =============================================================
-- INDEXES
-- =============================================================
create index idx_profiles_client_id  on profiles(client_id);
create index idx_projects_client_id  on projects(client_id);
create index idx_galleries_client_id on galleries(client_id);
create index idx_galleries_project   on galleries(project_id);
create index idx_assets_gallery_id   on assets(gallery_id);
create index idx_assets_client_id    on assets(client_id);
create index idx_invoices_client_id  on invoices(client_id);
create index idx_threads_client_id   on threads(client_id);
create index idx_messages_thread_id  on messages(thread_id);
create index idx_messages_client_id  on messages(client_id);

-- =============================================================
-- STORAGE BUCKETS
-- =============================================================
-- images: public read (enables CDN transforms / srcset / blur-up)
-- videos, documents: private (served via signed URLs)
insert into storage.buckets (id, name, public)
values
  ('images',    'images',    true),
  ('videos',    'videos',    false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- =============================================================
-- RLS HELPER FUNCTIONS (public schema — auth schema is locked)
-- =============================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from profiles where id = auth.uid() limit 1;
$$;

-- Auto-create a profile row when a new auth user is created.
-- Defaults to role 'client'; promote to admin manually.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table profiles  enable row level security;
alter table clients   enable row level security;
alter table projects  enable row level security;
alter table galleries enable row level security;
alter table assets    enable row level security;
alter table invoices  enable row level security;
alter table threads   enable row level security;
alter table messages  enable row level security;

-- ---- profiles -----------------------------------------------
create policy "profiles: self read"   on profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: self update" on profiles for update using (id = auth.uid());
create policy "profiles: admin all"   on profiles for all    using (public.is_admin()) with check (public.is_admin());

-- ---- clients ------------------------------------------------
create policy "clients: admin all"    on clients for all    using (public.is_admin()) with check (public.is_admin());
create policy "clients: own read"     on clients for select using (id = public.my_client_id());

-- ---- projects -----------------------------------------------
create policy "projects: admin all"   on projects for all    using (public.is_admin()) with check (public.is_admin());
create policy "projects: own read"    on projects for select using (client_id = public.my_client_id());

-- ---- galleries ----------------------------------------------
create policy "galleries: admin all"  on galleries for all   using (public.is_admin()) with check (public.is_admin());
create policy "galleries: own read"   on galleries for select using (client_id = public.my_client_id() and published = true);

-- ---- assets -------------------------------------------------
create policy "assets: admin all"     on assets for all      using (public.is_admin()) with check (public.is_admin());
create policy "assets: own read"      on assets for select   using (client_id = public.my_client_id());

-- ---- invoices -----------------------------------------------
create policy "invoices: admin all"   on invoices for all    using (public.is_admin()) with check (public.is_admin());
create policy "invoices: own read"    on invoices for select using (client_id = public.my_client_id() and status <> 'draft');

-- ---- threads ------------------------------------------------
create policy "threads: admin all"    on threads for all     using (public.is_admin()) with check (public.is_admin());
create policy "threads: own read"     on threads for select  using (client_id = public.my_client_id());
create policy "threads: own insert"   on threads for insert  with check (client_id = public.my_client_id());

-- ---- messages -----------------------------------------------
create policy "messages: admin all"   on messages for all    using (public.is_admin()) with check (public.is_admin());
create policy "messages: own read"    on messages for select using (client_id = public.my_client_id());
create policy "messages: own insert"  on messages for insert
  with check (client_id = public.my_client_id() and author_id = auth.uid() and author_role = 'client');

-- =============================================================
-- STORAGE RLS
-- =============================================================
-- images: public read; admins write
create policy "images: public read"   on storage.objects for select using (bucket_id = 'images');
create policy "images: admin write"   on storage.objects for insert with check (bucket_id = 'images' and public.is_admin());
create policy "images: admin update"  on storage.objects for update using (bucket_id = 'images' and public.is_admin());
create policy "images: admin delete"  on storage.objects for delete using (bucket_id = 'images' and public.is_admin());

-- videos + documents: admin write; read via signed URLs (service role)
create policy "private: admin write"  on storage.objects for insert
  with check (bucket_id in ('videos','documents') and public.is_admin());
create policy "private: admin delete" on storage.objects for delete
  using (bucket_id in ('videos','documents') and public.is_admin());
