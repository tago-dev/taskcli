create table if not exists public.tasks (
  id text primary key,
  user_id text not null,
  title text not null,
  completed boolean default false not null,
  priority text default 'medium' not null check (priority in ('low', 'medium', 'high')),
  tags text[] default '{}'::text[] not null,
  estimated_pomodoros integer default 1 not null,
  completed_pomodoros integer default 0 not null,
  created_at bigint not null,
  completed_at bigint,
  team_id text,
  assignee_id text,
  assignee_name text,
  assignee_email text,
  assignee_avatar text,
  assigned_by_id text,
  assigned_by_name text,
  assigned_at bigint,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done'))
);

alter table public.tasks add column if not exists team_id text;
alter table public.tasks add column if not exists assignee_id text;
alter table public.tasks add column if not exists assignee_name text;
alter table public.tasks add column if not exists assignee_email text;
alter table public.tasks add column if not exists assignee_avatar text;
alter table public.tasks add column if not exists assigned_by_id text;
alter table public.tasks add column if not exists assigned_by_name text;
alter table public.tasks add column if not exists assigned_at bigint;
alter table public.tasks add column if not exists status text default 'todo';

create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_team_id on public.tasks (team_id);
create index if not exists idx_tasks_assignee_id on public.tasks (assignee_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);

create table if not exists public.notes (
  id text primary key,
  user_id text not null,
  title text not null,
  content text default '' not null,
  tags text[] default '{}'::text[] not null,
  pinned boolean default false not null,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_notes_user_id on public.notes (user_id);
create index if not exists idx_notes_pinned on public.notes (pinned desc, updated_at desc);

alter table public.tasks enable row level security;
alter table public.notes enable row level security;

create policy "Allow all access to public.tasks with matching user_id"
on public.tasks
for all
to anon, authenticated
using (true)
with check (true);

create policy "Allow all access to public.notes with matching user_id"
on public.notes
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.tasks to anon, authenticated;
grant select, insert, update, delete on public.notes to anon, authenticated;
