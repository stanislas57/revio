-- Revio — Focus sessions, XP / streak and social feed (owner: Charles).
--
-- What this migration does:
--   1. study_sessions: adds a shareable free-text label (the "matière" friends see,
--      never the private `subjects` row), pause tracking and the official result
--      of a session (duration, XP, streak). Clients can no longer write
--      timestamps, status or results: a trigger normalises inserts and only
--      `visibility` / `label` stay updatable. Pause / resume / complete / abandon
--      go through security definer functions that use the server clock.
--   2. XP is granted only by complete_study_session(), idempotently
--      ('session:<uuid>', 'streak:<yyyy-mm-dd>').
--   3. Streak is derived from completed sessions (no table).
--   4. session_reactions: one "encouragement" per user and per visible session.
--   5. get_friends_overview(): friends with level data and live status.
--
-- Revio conventions (not official rules, can change in a later migration):
--   * Day boundaries use Europe/Paris.
--   * A day counts for the streak when completed sessions ended that day total
--     at least 10 minutes.
--   * XP: 1 XP per effective minute, capped at 240 per session;
--     streak bonus 100 / 250 / 500 XP when the streak reaches 7 / 21 / 30 days.

-- ---------------------------------------------------------------------------
-- study_sessions: new columns
-- ---------------------------------------------------------------------------

alter table public.study_sessions
  add column label text
    check (label is null or char_length(label) between 1 and 60),
  add column paused_at timestamptz,
  add column paused_seconds integer not null default 0
    check (paused_seconds >= 0),
  add column duration_minutes integer
    check (duration_minutes is null or duration_minutes >= 0),
  add column xp_awarded integer
    check (xp_awarded is null or xp_awarded >= 0),
  add column streak_days integer
    check (streak_days is null or streak_days >= 0),
  add constraint study_sessions_paused_only_running
    check (paused_at is null or status = 'in_progress');

create index study_sessions_feed_idx
  on public.study_sessions (ended_at desc) where status = 'completed';

-- Clients may only choose subject, planned duration, visibility and label.
-- Everything else is set by the server clock / functions below.
create or replace function public.study_sessions_normalize_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'in_progress';
  new.started_at := now();
  new.ended_at := null;
  new.paused_at := null;
  new.paused_seconds := 0;
  new.duration_minutes := null;
  new.xp_awarded := null;
  new.streak_days := null;
  new.created_at := now();
  return new;
end;
$$;

create trigger study_sessions_normalize_insert
  before insert on public.study_sessions
  for each row execute function public.study_sessions_normalize_insert();

-- Only visibility and label can be changed directly by the owner.
revoke update on public.study_sessions from authenticated, anon;
grant update (visibility, label) on public.study_sessions to authenticated;

-- ---------------------------------------------------------------------------
-- Streak (derived, never stored as a source of truth)
-- ---------------------------------------------------------------------------

create or replace function public.streak_stats(p_user uuid)
returns table (current_streak integer, best_streak integer)
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select (s.ended_at at time zone 'Europe/Paris')::date as d
    from public.study_sessions s
    where s.user_id = p_user and s.status = 'completed'
    group by 1
    having sum(s.duration_minutes) >= 10
  ),
  islands as (
    select d, d - (row_number() over (order by d))::integer as grp from days
  ),
  runs as (
    select max(d) as end_d, count(*)::integer as len from islands group by grp
  )
  select
    coalesce((
      select r.len from runs r
      -- Still alive if the last validated day is today or yesterday.
      where r.end_d >= (now() at time zone 'Europe/Paris')::date - 1
      order by r.end_d desc limit 1
    ), 0),
    coalesce((select max(r.len) from runs r), 0);
$$;

-- Internal helper: callers go through the functions below (caller-scoped).
revoke execute on function public.streak_stats(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Session lifecycle (server clock only)
-- ---------------------------------------------------------------------------

create or replace function public.pause_study_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.study_sessions
    set paused_at = now()
    where id = p_session_id and user_id = (select auth.uid())
      and status = 'in_progress' and paused_at is null;
  if not found then raise exception 'session not running or already paused' using errcode = 'P0001'; end if;
end;
$$;

create or replace function public.resume_study_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.study_sessions
    set paused_seconds = paused_seconds + floor(extract(epoch from now() - paused_at))::integer,
        paused_at = null
    where id = p_session_id and user_id = (select auth.uid())
      and status = 'in_progress' and paused_at is not null;
  if not found then raise exception 'session not paused' using errcode = 'P0001'; end if;
end;
$$;

create or replace function public.abandon_study_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.study_sessions
    set status = 'abandoned', ended_at = now(), paused_at = null
    where id = p_session_id and user_id = (select auth.uid()) and status = 'in_progress';
  if not found then raise exception 'session not running' using errcode = 'P0001'; end if;
end;
$$;

-- Ends a running session and grants XP. Returns the official result.
create or replace function public.complete_study_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_now timestamptz := now();
  v_session public.study_sessions;
  v_paused integer;
  v_minutes integer;
  v_xp_session integer;
  v_bonus integer := 0;
  v_streak integer;
  v_today date := (v_now at time zone 'Europe/Paris')::date;
  v_rows integer;
  v_total integer;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '42501'; end if;

  select * into v_session from public.study_sessions
    where id = p_session_id and user_id = v_uid
    for update;
  if not found or v_session.status <> 'in_progress' then
    raise exception 'session not running' using errcode = 'P0001';
  end if;

  v_paused := v_session.paused_seconds
    + coalesce(floor(extract(epoch from v_now - v_session.paused_at))::integer, 0);
  v_minutes := greatest(0, floor((extract(epoch from v_now - v_session.started_at) - v_paused) / 60)::integer);
  v_xp_session := least(v_minutes, 240);

  update public.study_sessions
    set status = 'completed', ended_at = v_now, paused_at = null,
        paused_seconds = v_paused, duration_minutes = v_minutes
    where id = v_session.id;

  if v_xp_session > 0 then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (v_uid, v_xp_session, 'session_completed', 'session:' || v_session.id, v_session.id)
      on conflict (user_id, idempotency_key) do nothing;
  end if;

  select s.current_streak into v_streak from public.streak_stats(v_uid) s;
  v_bonus := case v_streak when 7 then 100 when 21 then 250 when 30 then 500 else 0 end;
  if v_bonus > 0 then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (v_uid, v_bonus, 'streak_bonus', 'streak:' || v_today::text, v_session.id)
      on conflict (user_id, idempotency_key) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then v_bonus := 0; end if; -- already granted today
  end if;

  update public.study_sessions
    set xp_awarded = v_xp_session + v_bonus, streak_days = v_streak
    where id = v_session.id;

  select coalesce(sum(x.amount), 0)::integer into v_total
    from public.xp_transactions x where x.user_id = v_uid;

  return jsonb_build_object(
    'session_id', v_session.id,
    'duration_minutes', v_minutes,
    'xp_session', v_xp_session,
    'xp_streak_bonus', v_bonus,
    'streak_days', v_streak,
    'total_xp', v_total
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Read models (caller-scoped)
-- ---------------------------------------------------------------------------

-- The caller's own XP, streak and last 35 days of activity.
create or replace function public.my_gamification()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total_xp', coalesce((select sum(x.amount) from public.xp_transactions x
                          where x.user_id = (select auth.uid())), 0),
    'current_streak', st.current_streak,
    'best_streak', st.best_streak,
    'total_minutes', coalesce((select sum(s.duration_minutes) from public.study_sessions s
                               where s.user_id = (select auth.uid()) and s.status = 'completed'), 0),
    'completed_sessions', (select count(*) from public.study_sessions s
                           where s.user_id = (select auth.uid()) and s.status = 'completed'),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('date', d.day, 'minutes', d.minutes) order by d.day)
      from (
        select (s.ended_at at time zone 'Europe/Paris')::date as day, sum(s.duration_minutes)::integer as minutes
        from public.study_sessions s
        where s.user_id = (select auth.uid()) and s.status = 'completed'
          and s.ended_at >= now() - interval '35 days'
        group by 1
      ) d
    ), '[]'::jsonb)
  )
  from public.streak_stats((select auth.uid())) st
  where (select auth.uid()) is not null;
$$;

-- Accepted friends of the caller: identity, total XP, streak and live session
-- (only if that session is shared with friends).
create or replace function public.get_friends_overview()
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_xp integer,
  current_streak integer,
  live_started_at timestamptz,
  live_paused_seconds integer,
  live_paused_at timestamptz,
  live_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id, p.username, p.display_name, p.avatar_url,
    coalesce((select sum(x.amount) from public.xp_transactions x where x.user_id = p.id), 0)::integer,
    (select st.current_streak from public.streak_stats(p.id) st),
    live.started_at, live.paused_seconds, live.paused_at, live.label
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = (select auth.uid()) then f.addressee_id else f.requester_id end
  left join lateral (
    select s.started_at, s.paused_seconds, s.paused_at, s.label
    from public.study_sessions s
    where s.user_id = p.id and s.status = 'in_progress' and s.visibility = 'friends'
    limit 1
  ) live on true
  where f.status = 'accepted'
    and (select auth.uid()) in (f.requester_id, f.addressee_id);
$$;

revoke execute on function
  public.pause_study_session(uuid),
  public.resume_study_session(uuid),
  public.abandon_study_session(uuid),
  public.complete_study_session(uuid),
  public.my_gamification(),
  public.get_friends_overview()
  from public, anon;
grant execute on function
  public.pause_study_session(uuid),
  public.resume_study_session(uuid),
  public.abandon_study_session(uuid),
  public.complete_study_session(uuid),
  public.my_gamification(),
  public.get_friends_overview()
  to authenticated;

-- ---------------------------------------------------------------------------
-- session_reactions ("encouragements" on the feed)
-- ---------------------------------------------------------------------------

create table public.session_reactions (
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index session_reactions_user_idx on public.session_reactions (user_id);

alter table public.session_reactions enable row level security;

-- Visible to whoever can see the session (study_sessions RLS applies here).
create policy "session_reactions: readable with the session"
  on public.session_reactions for select to authenticated
  using (exists (select 1 from public.study_sessions s where s.id = session_id));

create policy "session_reactions: react to a visible completed session of someone else"
  on public.session_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.study_sessions s
      where s.id = session_id and s.status = 'completed' and s.user_id <> (select auth.uid())
    )
  );

create policy "session_reactions: author can remove"
  on public.session_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke update on public.session_reactions from authenticated, anon;
