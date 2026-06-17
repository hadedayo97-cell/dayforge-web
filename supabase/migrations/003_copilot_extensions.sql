-- Copilot plan extensions: milestones, task ordering, recurring rules
-- Safe to run on existing DayForge Supabase projects

-- ─── Tasks: order_index + recurring_rule (Copilot spec) ─────────────────────
alter table public.tasks
  add column if not exists order_index integer not null default 0;

alter table public.tasks
  add column if not exists recurring_rule text;

create index if not exists tasks_order_index_idx on public.tasks (user_id, order_index);

-- ─── Milestones (Copilot spec — not yet used in UI) ─────────────────────────
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists milestones_goal_id_idx on public.milestones (goal_id);
create index if not exists milestones_user_id_idx on public.milestones (user_id);

drop trigger if exists milestones_set_updated_at on public.milestones;
create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- ─── RLS for milestones ─────────────────────────────────────────────────────
alter table public.milestones enable row level security;

drop policy if exists "milestones_select_own" on public.milestones;
create policy "milestones_select_own" on public.milestones
  for select using (auth.uid() = user_id);

drop policy if exists "milestones_insert_own" on public.milestones;
create policy "milestones_insert_own" on public.milestones
  for insert with check (auth.uid() = user_id);

drop policy if exists "milestones_update_own" on public.milestones;
create policy "milestones_update_own" on public.milestones
  for update using (auth.uid() = user_id);

drop policy if exists "milestones_delete_own" on public.milestones;
create policy "milestones_delete_own" on public.milestones
  for delete using (auth.uid() = user_id);
