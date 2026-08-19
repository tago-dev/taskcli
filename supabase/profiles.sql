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

alter table public.profiles enable row level security;

create policy "Allow all access to public.profiles"
on public.profiles
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.profiles to anon, authenticated;
