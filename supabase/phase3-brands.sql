-- =============================================================
-- Swells Lab — PHASE 3 (App Fase 1): RBAC + Brand Hub
-- Run ONCE in Supabase SQL Editor. Idempotent & incremental.
-- Does NOT drop anything from the existing schema.
-- =============================================================

-- ---- 1. Expand roles: master | staff | admin | client -------
-- Keep 'admin' valid for backward-compat. 'master' = superadmin.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('master','staff','admin','client'));

-- Promote the studio owner to master.
update profiles set role = 'master' where email = 'neto@swells.mx';

-- is_admin() now also covers master + staff (studio-side access).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('master','staff','admin')
  );
$$;

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'master');
$$;

-- ---- 2. brands (a client can have many) ---------------------
create table if not exists brands (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid not null references clients(id) on delete cascade,
  name           text not null,
  slug           text not null,
  tagline        text,
  logo_url       text,
  accent_color   text,
  active         boolean not null default true,
  client_visible boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz default now() not null,
  unique (client_id, slug)
);

-- ---- 3. brand_assets (logos, photos, generic files) ---------
create table if not exists brand_assets (
  id            uuid primary key default uuid_generate_v4(),
  brand_id      uuid not null references brands(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  kind          text not null default 'file' check (kind in ('logo','photo','file')),
  label         text,
  bucket        text not null default 'documents',
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint,
  category      text,            -- e.g. 'Logos', 'Brandbook', 'Plantillas'
  downloadable  boolean not null default true,
  client_visible boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz default now() not null
);

-- ---- 4. design_refs (tokens + Figma/Drive/web links) --------
create table if not exists design_refs (
  id            uuid primary key default uuid_generate_v4(),
  brand_id      uuid not null references brands(id) on delete cascade,
  kind          text not null check (kind in ('color','font','figma','drive','link')),
  label         text not null,
  description   text,
  url           text,            -- for figma/drive/link
  value         text,            -- hex for color, family for font
  category      text,            -- function/category grouping
  client_visible boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz default now() not null
);

-- ---- 5. galleries now optionally belong to a brand ----------
alter table galleries add column if not exists brand_id uuid
  references brands(id) on delete set null;

-- ---- 6. Indexes ---------------------------------------------
create index if not exists idx_brands_client_id     on brands(client_id);
create index if not exists idx_brand_assets_brand   on brand_assets(brand_id);
create index if not exists idx_design_refs_brand    on design_refs(brand_id);
create index if not exists idx_galleries_brand_id   on galleries(brand_id);

-- =============================================================
-- NOTE on RLS: to match the current posture of galleries/assets
-- (RLS disabled, protected by middleware + explicit client_id
-- filtering), these tables ship with RLS disabled in Fase 1.
-- Hardening pass comes later. Client portal queries filter by
-- client_id + client_visible explicitly.
-- =============================================================
alter table brands       disable row level security;
alter table brand_assets disable row level security;
alter table design_refs  disable row level security;
