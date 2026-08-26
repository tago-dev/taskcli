alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Allow all access to public.profiles" on public.profiles;
drop policy if exists "Allow all access to public.teams" on public.teams;
drop policy if exists "Allow all access to public.team_members" on public.team_members;
drop policy if exists "Allow all access to public.tasks" on public.tasks;
drop policy if exists "Allow all access to public.tasks with matching user_id" on public.tasks;
drop policy if exists "Allow all access to public.notes" on public.notes;
drop policy if exists "Allow all access to public.notes with matching user_id" on public.notes;

drop policy if exists "Require authentication for public.profiles" on public.profiles;
drop policy if exists "Require authentication for public.teams" on public.teams;
drop policy if exists "Require authentication for public.team_members" on public.team_members;
drop policy if exists "Require authentication for public.tasks" on public.tasks;
drop policy if exists "Require authentication for public.notes" on public.notes;

create policy "Require authentication for public.profiles"
on public.profiles for all to authenticated using (true) with check (true);

create policy "Require authentication for public.teams"
on public.teams for all to authenticated using (true) with check (true);

create policy "Require authentication for public.team_members"
on public.team_members for all to authenticated using (true) with check (true);

create policy "Require authentication for public.tasks"
on public.tasks for all to authenticated using (true) with check (true);

create policy "Require authentication for public.notes"
on public.notes for all to authenticated using (true) with check (true);

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
