-- ============================================================
-- DayForge – Initial Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. PROFILES
-- Links to Supabase Auth (auth.users)
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  timezone    text default 'UTC',
  birthday    date,
  created_at  timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  -- Insert welcome notification scheduled for immediate dispatch
  insert into public.notifications (user_id, type, payload, send_at, status)
  values (
    new.id,
    'welcome',
    jsonb_build_object(
      'title', 'Welcome to DayForge! 🚀',
      'message', 'We''re thrilled to have you here! Let''s set up your first goal and start forging a better day-to-day lifecycle.'
    ),
    now(),
    'scheduled'
  );

  return new;
end;
$$;

-- Drop the trigger first if it already exists (safe re-run)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────
-- 2. GOALS
-- ──────────────────────────────────────────────
create table if not exists public.goals (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  description       text default '',
  deadline          date,
  priority          text not null default 'medium'
                      check (priority in ('low', 'medium', 'high')),
  progress_percent  int not null default 0
                      check (progress_percent between 0 and 100),
  status            text not null default 'active'
                      check (status in ('active', 'completed', 'archived')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 3. TASKS
-- ──────────────────────────────────────────────
create table if not exists public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  goal_id         uuid references public.goals(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  due_date        date,
  completed       boolean not null default false,
  order_index     int not null default 0,
  recurring_rule  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 4. NOTIFICATIONS
-- ──────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null default 'reminder',
  payload     jsonb default '{}',
  send_at     timestamptz,
  sent_at     timestamptz,
  status      text not null default 'scheduled'
                check (status in ('scheduled', 'sent', 'failed', 'cancelled')),
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────
-- 5. INDEXES for common queries
-- ──────────────────────────────────────────────
create index if not exists idx_goals_user      on public.goals(user_id);
create index if not exists idx_tasks_user      on public.tasks(user_id);
create index if not exists idx_tasks_goal      on public.tasks(goal_id);
create index if not exists idx_tasks_due_date  on public.tasks(due_date);
create index if not exists idx_notif_user      on public.notifications(user_id);
create index if not exists idx_notif_send_at   on public.notifications(send_at)
  where status = 'scheduled';

-- ──────────────────────────────────────────────
-- 6. AUTO-UPDATE updated_at COLUMNS
-- ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ──────────────────────────────────────────────

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Goals
alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select
  using ( auth.uid() = user_id );

create policy "Users can insert own goals"
  on public.goals for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own goals"
  on public.goals for update
  using ( auth.uid() = user_id );

create policy "Users can delete own goals"
  on public.goals for delete
  using ( auth.uid() = user_id );

-- Tasks
alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own tasks"
  on public.tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete own tasks"
  on public.tasks for delete
  using ( auth.uid() = user_id );

-- Notifications
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );

create policy "Users can insert own notifications"
  on public.notifications for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own notifications"
  on public.notifications for update
  using ( auth.uid() = user_id );

create policy "Users can delete own notifications"
  on public.notifications for delete
  using ( auth.uid() = user_id );

-- ============================================================
-- ✅ Done! All tables, triggers, indexes, and RLS policies
--    are now in place.
-- ============================================================
