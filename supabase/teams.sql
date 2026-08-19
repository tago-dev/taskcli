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

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "Allow all access to public.teams"
on public.teams
for all
to anon, authenticated
using (true)
with check (true);

create policy "Allow all access to public.team_members"
on public.team_members
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.teams to anon, authenticated;
grant select, insert, update, delete on public.team_members to anon, authenticated;
