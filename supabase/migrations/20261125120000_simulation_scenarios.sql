-- Revio — saved simulator scenarios (S-22).
--
-- A scenario is a named list of HYPOTHETICAL grades (subject, value, scale, coefficient). It
-- describes the user's grades, so it is strictly private, like grades and subjects: owner only,
-- never visible to a friend. Hypotheses are stored as jsonb without a foreign key: a subject
-- deleted later simply makes its hypothesis inapplicable (the app ignores it).
-- At most 20 scenarios per user, 20 hypotheses each.

create table public.simulation_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  hypotheses jsonb not null
    check (jsonb_typeof(hypotheses) = 'array' and jsonb_array_length(hypotheses) between 1 and 20),
  created_at timestamptz not null default now()
);

create index simulation_scenarios_user_idx on public.simulation_scenarios (user_id, created_at desc);

alter table public.simulation_scenarios enable row level security;

create policy "simulation_scenarios: owner only"
  on public.simulation_scenarios for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.simulation_scenarios from anon;
grant select, insert, update, delete on public.simulation_scenarios to authenticated;

create or replace function public._limit_scenarios()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.simulation_scenarios where user_id = new.user_id) >= 20 then
    raise exception 'too many scenarios' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger simulation_scenarios_limit before insert on public.simulation_scenarios
  for each row execute function public._limit_scenarios();
