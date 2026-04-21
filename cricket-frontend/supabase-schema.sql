create extension if not exists pgcrypto;

create table if not exists public.matches (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_id text not null unique,
  status text not null,
  team_a_name text not null,
  team_b_name text not null,
  winner_team_name text,
  overs_per_innings integer not null check (overs_per_innings between 1 and 20),
  result_summary text,
  scorecard jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_matches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.set_matches_updated_at();

alter table public.matches enable row level security;

drop policy if exists "Users can read own matches" on public.matches;
create policy "Users can read own matches"
on public.matches
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own matches" on public.matches;
create policy "Users can insert own matches"
on public.matches
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own matches" on public.matches;
create policy "Users can update own matches"
on public.matches
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.get_shared_match(p_share_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select scorecard
  from public.matches
  where share_id = p_share_id
  limit 1;
$$;

grant execute on function public.get_shared_match(text) to anon, authenticated;
