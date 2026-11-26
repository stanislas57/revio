-- Schools (public reference data) and the school each user chooses (private).
--  * `schools`: lycées and higher-education establishments of France, loaded by the next migration from
--    open data (Licence Ouverte Etalab). Readable by signed-in users, never writable by the client.
--  * `user_education`: the school a user picked and whether the first-run card was dealt with. Owner-only:
--    a school is not shown to friends (data minimisation, users may be minors).

create table public.schools (
  id text primary key check (char_length(id) between 3 and 20), -- UAI code
  name text not null check (char_length(name) between 1 and 200),
  kind text not null check (kind in ('lycee', 'lycee_pro', 'universite', 'ecole')),
  is_public boolean,
  city text,
  postal_code text,
  department text,
  -- Lowercase, unaccented words of name, city, code and department (searched with `like`).
  search text not null
);

create index schools_kind_idx on public.schools (kind);

alter table public.schools enable row level security;

grant select on public.schools to authenticated;

create policy "schools: signed-in users can read"
  on public.schools for select to authenticated
  using (true);

create table public.user_education (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  school_id text references public.schools (id) on delete set null,
  -- True once the user chose a school or skipped the first-run card.
  onboarding_done boolean not null default false,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.user_education to authenticated;

alter table public.user_education enable row level security;

create policy "user_education: owner can read"
  on public.user_education for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_education: owner can insert"
  on public.user_education for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "user_education: owner can update"
  on public.user_education for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "user_education: owner can delete"
  on public.user_education for delete to authenticated
  using (user_id = (select auth.uid()));

create trigger user_education_set_updated_at
  before update on public.user_education
  for each row execute function public.set_updated_at();

-- Search by words (already lowercase and unaccented, see normalize in the app), optionally by kind.
-- Names that start with the query come first. 20 results at most.
create or replace function public.search_schools(
  p_query text,
  p_kind text default null,
  p_limit integer default 20
)
returns setof public.schools
language sql
stable
set search_path = ''
as $$
  select s.*
  from public.schools s
  where (p_kind is null or s.kind = p_kind)
    and (
      select bool_and(s.search like '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%')
      from unnest(regexp_split_to_array(trim(p_query), '\s+')) as w
    )
  order by (s.search like trim(p_query) || '%') desc, s.name
  limit least(greatest(coalesce(p_limit, 20), 1), 30);
$$;

revoke execute on function public.search_schools(text, text, integer) from public, anon;
grant execute on function public.search_schools(text, text, integer) to authenticated;
