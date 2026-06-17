-- =============================================================
-- Swells Lab — PHASE 6 (App Fase 4): Agente IA Diseñador
-- Run ONCE in Supabase SQL Editor. Idempotent & incremental.
-- =============================================================

-- One conversation thread per brand (kept simple: 1 active thread/brand,
-- but the schema allows several).
create table if not exists ai_conversations (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    uuid references brands(id) on delete cascade,
  title       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create table if not exists ai_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz default now() not null
);

create index if not exists idx_ai_conv_brand    on ai_conversations(brand_id);
create index if not exists idx_ai_msg_conv       on ai_messages(conversation_id, created_at);

alter table ai_conversations disable row level security;
alter table ai_messages      disable row level security;
