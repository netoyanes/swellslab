-- =============================================================
-- Swells Lab — PHASE 4 (App Fase 2): Tareas + Notificaciones
-- Run ONCE in Supabase SQL Editor. Idempotent & incremental.
-- =============================================================

-- ---- 1. tasks -----------------------------------------------
create table if not exists tasks (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid references clients(id) on delete set null,
  brand_id      uuid references brands(id) on delete set null,
  title         text not null,
  description   text,
  status        text not null default 'todo'
                  check (status in ('todo','in_progress','review','done')),
  priority      text not null default 'medium'
                  check (priority in ('low','medium','high','urgent')),
  due_date      date,
  created_by    uuid references auth.users(id) on delete set null,
  display_order integer not null default 0,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ---- 2. task_assignees (many-to-many) -----------------------
create table if not exists task_assignees (
  task_id  uuid not null references tasks(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  primary key (task_id, user_id)
);

-- ---- 3. task_comments ---------------------------------------
create table if not exists task_comments (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  body        text not null,
  created_at  timestamptz default now() not null
);

-- ---- 4. notifications (in-app feed) -------------------------
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,            -- task_assigned, comment, due_soon, ...
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz default now() not null
);

-- ---- 5. push_subscriptions (Web Push) -----------------------
create table if not exists push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now() not null
);

-- ---- 6. notification_rules (config, scaffold) ---------------
create table if not exists notification_rules (
  id          uuid primary key default uuid_generate_v4(),
  event       text not null,            -- e.g. task_assigned
  channel     text not null default 'in_app' check (channel in ('in_app','push','email')),
  enabled     boolean not null default true,
  created_at  timestamptz default now() not null,
  unique (event, channel)
);

-- ---- 7. Indexes ---------------------------------------------
create index if not exists idx_tasks_status        on tasks(status);
create index if not exists idx_tasks_brand_id       on tasks(brand_id);
create index if not exists idx_tasks_client_id      on tasks(client_id);
create index if not exists idx_task_assignees_user  on task_assignees(user_id);
create index if not exists idx_task_comments_task   on task_comments(task_id);
create index if not exists idx_notifications_user   on notifications(user_id, read_at);
create index if not exists idx_push_subs_user       on push_subscriptions(user_id);

-- ---- 8. Default notification rules --------------------------
insert into notification_rules (event, channel) values
  ('task_assigned','in_app'), ('task_assigned','push'),
  ('task_status','in_app'),
  ('task_comment','in_app'), ('task_comment','push'),
  ('due_soon','in_app'), ('due_soon','push')
on conflict (event, channel) do nothing;

-- RLS disabled to match current posture (middleware + app checks).
alter table tasks             disable row level security;
alter table task_assignees    disable row level security;
alter table task_comments     disable row level security;
alter table notifications     disable row level security;
alter table push_subscriptions disable row level security;
alter table notification_rules disable row level security;
