-- Revio — initial schema (minimal, demo scope).
-- Tables: profiles, subjects, grades, study_sessions, xp_transactions, friendships.
-- Principles:
--   * RLS enabled on every table, policies only for the `authenticated` role.
--   * Grades and subjects are strictly private (owner only).
--   * XP can never be written by the client: no insert/update/delete policy.
--     XP is granted server-side (security definer function or service role),
--     and `unique (user_id, idempotency_key)` makes every grant idempotent
--     (e.g. 'session:<uuid>', 'streak:2026-11-25').

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1-1 with auth.users, created automatically on sign-up)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique
    check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default ''
    check (char_length(display_name) <= 60),
  avatar_url text
    check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'display_name', 60), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Public identity (username, display name, avatar) is visible to signed-in
-- users so they can find and add friends. Nothing sensitive lives here.
create policy "profiles: signed-in users can read"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert policy (trigger only), no delete policy (cascade from auth.users).

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One relation per pair, whatever the direction.
create unique index friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "friendships: participants can read"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "friendships: requester creates a pending request"
  on public.friendships for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');

create policy "friendships: addressee accepts"
  on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'pending')
  with check (addressee_id = (select auth.uid()) and status = 'accepted');

create policy "friendships: participants can delete"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- Only `status` and `responded_at` may ever be updated (ids are immutable).
revoke update on public.friendships from authenticated, anon;
grant update (status, responded_at) on public.friendships to authenticated;

-- True when a and b are accepted friends. Security definer so it can be used
-- inside other tables' policies without exposing friendships rows.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Only answers for pairs that include the caller (no graph probing).
  select (select auth.uid()) in (a, b) and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
  );
$$;

revoke execute on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- subjects (private)
-- ---------------------------------------------------------------------------

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  coefficient numeric(6, 2) not null default 1 check (coefficient > 0 and coefficient <= 100),
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index subjects_user_idx on public.subjects (user_id);

alter table public.subjects enable row level security;

create policy "subjects: owner only"
  on public.subjects for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- grades (private by default — never visible to friends)
-- ---------------------------------------------------------------------------

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  subject_id uuid not null,
  label text check (label is null or char_length(label) <= 120),
  value numeric(6, 2) not null check (value >= 0),
  max_value numeric(6, 2) not null default 20 check (max_value > 0),
  coefficient numeric(6, 2) not null default 1 check (coefficient > 0 and coefficient <= 100),
  graded_on date,
  created_at timestamptz not null default now(),
  check (value <= max_value),
  -- A grade can only point to a subject owned by the same user.
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade
);

create index grades_user_subject_idx on public.grades (user_id, subject_id);

alter table public.grades enable row level security;

create policy "grades: owner only"
  on public.grades for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- study_sessions (Focus)
-- ---------------------------------------------------------------------------

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Optional link to one of the owner's subjects. Friends see the session,
  -- never the subject row itself (subjects stay owner-only).
  subject_id uuid,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  visibility text not null default 'friends'
    check (visibility in ('private', 'friends')),
  planned_minutes integer check (planned_minutes is null or planned_minutes between 1 and 600),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  check ((status = 'in_progress') = (ended_at is null)),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

create index study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);
-- At most one running session per user.
create unique index study_sessions_one_running
  on public.study_sessions (user_id) where status = 'in_progress';

alter table public.study_sessions enable row level security;

create policy "study_sessions: owner or friends (if shared) can read"
  on public.study_sessions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (visibility = 'friends' and public.are_friends((select auth.uid()), user_id))
  );

create policy "study_sessions: owner inserts"
  on public.study_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "study_sessions: owner updates"
  on public.study_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "study_sessions: owner deletes"
  on public.study_sessions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- xp_transactions (append-only ledger, server-written only)
-- ---------------------------------------------------------------------------

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0 and amount between -10000 and 10000),
  reason text not null
    check (reason in ('session_completed', 'streak_bonus', 'challenge', 'adjustment')),
  -- Deterministic key for idempotence: 'session:<uuid>', 'streak:<yyyy-mm-dd>'...
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 200),
  study_session_id uuid references public.study_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index xp_transactions_user_created_idx on public.xp_transactions (user_id, created_at desc);

alter table public.xp_transactions enable row level security;

create policy "xp_transactions: owner can read"
  on public.xp_transactions for select to authenticated
  using (user_id = (select auth.uid()));

-- Intentionally no insert/update/delete policy: clients cannot mint XP.
revoke insert, update, delete on public.xp_transactions from authenticated, anon;
