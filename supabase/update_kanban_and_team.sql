alter table if exists public.tasks add column if not exists team_id text;
alter table if exists public.tasks add column if not exists assignee_id text;
alter table if exists public.tasks add column if not exists assignee_name text;
alter table if exists public.tasks add column if not exists assignee_email text;
alter table if exists public.tasks add column if not exists assignee_avatar text;
alter table if exists public.tasks add column if not exists assigned_by_id text;
alter table if exists public.tasks add column if not exists assigned_by_name text;
alter table if exists public.tasks add column if not exists assigned_at bigint;
alter table if exists public.tasks add column if not exists status text default 'todo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_status_check'
  ) then
    alter table public.tasks add constraint tasks_status_check check (status in ('todo', 'in_progress', 'done'));
  end if;
end $$;

create index if not exists idx_tasks_team_id on public.tasks (team_id);
create index if not exists idx_tasks_assignee_id on public.tasks (assignee_id);
create index if not exists idx_tasks_status on public.tasks (status);

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text not null,
  avatar_url text,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_name on public.profiles (name);

create table if not exists public.teams (
  id text primary key,
  user_id text not null,
  name text not null,
  description text default '' not null,
  code text not null unique,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_teams_user_id on public.teams (user_id);
create index if not exists idx_teams_code on public.teams (code);

create table if not exists public.team_members (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  user_id text,
  name text not null,
  email text not null,
  role text default 'member' not null check (role in ('owner', 'admin', 'member')),
  avatar_url text,
  joined_at bigint not null
);

create index if not exists idx_team_members_team_id on public.team_members (team_id);
create index if not exists idx_team_members_email on public.team_members (email);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Allow all access to public.profiles') then
    create policy "Allow all access to public.profiles" on public.profiles for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow all access to public.teams') then
    create policy "Allow all access to public.teams" on public.teams for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow all access to public.team_members') then
    create policy "Allow all access to public.team_members" on public.team_members for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow all access to public.tasks') then
    create policy "Allow all access to public.tasks" on public.tasks for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Allow all access to public.notes') then
    create policy "Allow all access to public.notes" on public.notes for all to authenticated using (true) with check (true);
  end if;
end $$;

revoke all on public.profiles from anon;
revoke all on public.teams from anon;
revoke all on public.team_members from anon;
revoke all on public.tasks from anon;
revoke all on public.notes from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
