-- Revio — study sessions: timestamps written by the server only (decision D-17).
-- Before this migration the owner could insert/update started_at, ended_at and
-- status directly, i.e. declare a 10-hour session. From now on the client can
-- only read sessions (and delete its own); every change goes through the
-- security definer functions below, which use the database clock (now()).
-- XP is NOT granted here: finish_study_session only closes the session. The
-- XP engine (S-05) will extend it.

-- ---------------------------------------------------------------------------
-- New columns
-- ---------------------------------------------------------------------------

alter table public.study_sessions
  add column mode text not null default 'free'
    check (mode in ('free', 'countdown', 'pomodoro')),
  add column paused_at timestamptz,
  add column paused_seconds integer not null default 0 check (paused_seconds >= 0),
  add column last_heartbeat_at timestamptz not null default now(),
  add constraint study_sessions_pause_only_while_running
    check (paused_at is null or status = 'in_progress'),
  add constraint study_sessions_planned_for_timers
    check (mode = 'free' or planned_minutes is not null);

-- ---------------------------------------------------------------------------
-- Clients lose direct write access (read and delete own rows stay allowed)
-- ---------------------------------------------------------------------------

drop policy "study_sessions: owner inserts" on public.study_sessions;
drop policy "study_sessions: owner updates" on public.study_sessions;
revoke insert, update on public.study_sessions from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Locks and returns one of the caller's sessions (any status), or raises. Never returns another user's row.
create or replace function public._own_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select * into s from public.study_sessions
    where id = p_session_id and user_id = (select auth.uid())
    for update;
  if not found then
    raise exception 'session not found' using errcode = 'P0002';
  end if;
  return s;
end;
$$;

revoke execute on function public._own_session(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- start / pause / resume / heartbeat / cancel / finish
-- ---------------------------------------------------------------------------

create or replace function public.start_study_session(
  p_mode text default 'free',
  p_subject_id uuid default null,
  p_planned_minutes integer default null,
  p_visibility text default 'friends'
)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  s public.study_sessions;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  -- A session left open (closed tab, crash) for more than 12 h is abandoned,
  -- so the user is not stuck. It never earns XP.
  update public.study_sessions
    set status = 'abandoned', ended_at = now(), paused_at = null
    where user_id = uid and status = 'in_progress'
      and last_heartbeat_at < now() - interval '12 hours';

  -- The composite foreign key guarantees the subject belongs to the caller;
  -- the partial unique index rejects a second running session (23505).
  insert into public.study_sessions (user_id, subject_id, mode, planned_minutes, visibility, started_at)
    values (uid, p_subject_id, p_mode, p_planned_minutes, p_visibility, now())
    returning * into s;
  return s;
end;
$$;

create or replace function public.pause_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  if s.status <> 'in_progress' or s.paused_at is not null then
    raise exception 'session is not running' using errcode = '55000';
  end if;
  update public.study_sessions
    set paused_at = now(), last_heartbeat_at = now()
    where id = s.id returning * into s;
  return s;
end;
$$;

create or replace function public.resume_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  if s.status <> 'in_progress' or s.paused_at is null then
    raise exception 'session is not paused' using errcode = '55000';
  end if;
  update public.study_sessions
    set paused_seconds = paused_seconds + floor(extract(epoch from now() - paused_at))::integer,
        paused_at = null,
        last_heartbeat_at = now()
    where id = s.id returning * into s;
  return s;
end;
$$;

create or replace function public.heartbeat_study_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  if s.status = 'in_progress' then
    update public.study_sessions set last_heartbeat_at = now() where id = s.id;
  end if;
end;
$$;

create or replace function public.cancel_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  if s.status <> 'in_progress' then
    raise exception 'session already ended' using errcode = '55000';
  end if;
  update public.study_sessions
    set status = 'abandoned', ended_at = now(), paused_at = null
    where id = s.id returning * into s;
  return s;
end;
$$;

-- Idempotent: calling it again on a completed session returns it unchanged.
create or replace function public.finish_study_session(p_session_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  if s.status = 'completed' then
    return s;
  end if;
  if s.status <> 'in_progress' then
    raise exception 'session was cancelled' using errcode = '55000';
  end if;
  update public.study_sessions
    set status = 'completed',
        ended_at = now(),
        paused_seconds = paused_seconds
          + coalesce(floor(extract(epoch from now() - paused_at))::integer, 0),
        paused_at = null
    where id = s.id returning * into s;
  return s;
end;
$$;

-- The owner may hide or share a session at any time (timestamps stay untouched).
create or replace function public.set_study_session_visibility(p_session_id uuid, p_visibility text)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
begin
  update public.study_sessions set visibility = p_visibility where id = s.id returning * into s;
  return s;
end;
$$;

-- Actual study time of a session, in seconds (pauses excluded), from server timestamps.
create or replace function public.study_session_seconds(s public.study_sessions)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(0, floor(extract(epoch from
    coalesce(s.paused_at, s.ended_at, now()) - s.started_at))::integer - s.paused_seconds);
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.start_study_session(text, uuid, integer, text)',
    'public.pause_study_session(uuid)',
    'public.resume_study_session(uuid)',
    'public.heartbeat_study_session(uuid)',
    'public.cancel_study_session(uuid)',
    'public.finish_study_session(uuid)',
    'public.set_study_session_visibility(uuid, text)',
    'public.study_session_seconds(public.study_sessions)'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;
