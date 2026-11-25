-- Revio — XP engine, streak, public stats, feed posts and reactions.
-- Builds ON TOP of 20261125020000_lock_study_session_timing.sql (it does not
-- touch Stan's start/pause/resume/heartbeat/cancel/finish functions).
--
-- Rules implemented here (decisions D-14, D-15, D-18 of DECISIONS.md; Revio
-- conventions, not official rules; to move to a table `xp_rules` later):
--   * 1 XP per minute, 5 minutes minimum, at most 180 minutes counted per
--     session and 300 XP of study time per day.
--   * Daily goal: +50 XP once per day when the day totals >= 30 minutes.
--   * Streak day: >= 10 minutes of completed sessions in the day; milestones
--     +100 / +250 / +500 XP at 7 / 21 / 30 days.
--   * Days use Europe/Paris until profiles.timezone exists (task S-04).
--
-- Clients can only call finalize_study_session (and the label / daily-minutes
-- helpers). They can never write XP, stats or posts.

-- ---------------------------------------------------------------------------
-- XP reasons used by the contracts (old values kept: existing rows / tests)
-- ---------------------------------------------------------------------------

alter table public.xp_transactions drop constraint xp_transactions_reason_check;
alter table public.xp_transactions add constraint xp_transactions_reason_check
  check (reason in (
    'session_completed', 'streak_bonus', 'challenge', 'adjustment',
    'study_duration', 'daily_goal', 'streak_milestone', 'planned_session'
  ));

-- ---------------------------------------------------------------------------
-- study_sessions: shareable label + stored official result
-- ---------------------------------------------------------------------------

alter table public.study_sessions
  add column label text check (label is null or char_length(label) between 1 and 60),
  add column result jsonb;

-- Free-text label shown to friends in the feed (never a `subjects` row, which
-- stays private). Owner only, through the server.
create or replace function public.set_study_session_label(p_session_id uuid, p_label text)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
  v_label text := nullif(btrim(coalesce(p_label, '')), '');
begin
  if v_label is not null and char_length(v_label) > 60 then
    raise exception 'label too long' using errcode = '22001';
  end if;
  update public.study_sessions set label = v_label where id = s.id returning * into s;
  return s;
end;
$$;

-- ---------------------------------------------------------------------------
-- Streak (derived from completed sessions)
-- ---------------------------------------------------------------------------

-- Internal: arbitrary user id, so never callable by clients.
create or replace function public._streak_stats(p_user uuid)
returns table (current_streak integer, best_streak integer, last_day date)
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
    having sum(public.study_session_seconds(s)) >= 600
  ),
  islands as (
    select d, d - (row_number() over (order by d))::integer as grp from days
  ),
  runs as (
    select max(d) as end_d, count(*)::integer as len from islands group by grp
  )
  select
    coalesce((
      -- Still alive when the last validated day is today or yesterday.
      select r.len from runs r
      where r.end_d >= (now() at time zone 'Europe/Paris')::date - 1
      order by r.end_d desc limit 1
    ), 0),
    coalesce((select max(r.len) from runs r), 0),
    (select max(d) from days);
$$;

revoke execute on function public._streak_stats(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- user_stats: public game data (D-18), readable by the user and their friends
-- ---------------------------------------------------------------------------

create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  -- Streak as of the last finalized session; readers must treat it as 0 when
  -- last_validated_on is older than yesterday.
  last_validated_on date,
  total_minutes integer not null default 0 check (total_minutes >= 0),
  sessions_count integer not null default 0 check (sessions_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

create policy "user_stats: owner or friends can read"
  on public.user_stats for select to authenticated
  using (user_id = (select auth.uid()) or public.are_friends((select auth.uid()), user_id));

revoke insert, update, delete on public.user_stats from authenticated, anon;

-- ---------------------------------------------------------------------------
-- posts (feed): one per finalized session, never any grade
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  study_session_id uuid not null unique references public.study_sessions (id) on delete cascade,
  type text not null default 'study_session_completed' check (type in ('study_session_completed')),
  subject_name text check (subject_name is null or char_length(subject_name) between 1 and 60),
  duration_minutes integer not null check (duration_minutes >= 0),
  earned_xp integer not null check (earned_xp >= 0),
  streak_days integer not null check (streak_days >= 0),
  created_at timestamptz not null default now()
);

create index posts_created_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

-- A post is visible exactly when its session is (study_sessions RLS applies in
-- the subquery): the owner, or friends while the session is shared.
create policy "posts: visible with their session"
  on public.posts for select to authenticated
  using (exists (select 1 from public.study_sessions s where s.id = posts.study_session_id));

revoke insert, update, delete on public.posts from authenticated, anon;

-- ---------------------------------------------------------------------------
-- post_reactions: one "bravo" per person and per post
-- ---------------------------------------------------------------------------

create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_reactions_user_idx on public.post_reactions (user_id);

alter table public.post_reactions enable row level security;

create policy "post_reactions: readable with the post"
  on public.post_reactions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_reactions.post_id));

create policy "post_reactions: react to a visible post"
  on public.post_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = post_reactions.post_id)
  );

create policy "post_reactions: author of the reaction can remove it"
  on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke update on public.post_reactions from authenticated, anon;

-- ---------------------------------------------------------------------------
-- finalize_study_session: finish + XP + streak + stats + post, idempotent
-- ---------------------------------------------------------------------------

create or replace function public.finalize_study_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_tz constant text := 'Europe/Paris';
  c_min_minutes constant integer := 5;
  c_max_counted constant integer := 180;
  c_day_xp_cap constant integer := 300;
  c_goal_minutes constant integer := 30;
  c_goal_xp constant integer := 50;
  c_streak_day_minutes constant integer := 10;
  v_uid uuid := (select auth.uid());
  s public.study_sessions;
  v_minutes integer;
  v_counted integer;
  v_below boolean;
  v_day date;
  v_day_xp integer;
  v_day_minutes integer;
  v_duration_xp integer := 0;
  v_goal_xp integer := 0;
  v_goal_done boolean;
  v_milestone integer;
  v_milestone_xp integer := 0;
  v_streak record;
  v_total integer;
  v_earned integer;
  v_breakdown jsonb := '[]'::jsonb;
  v_post boolean := false;
  v_result jsonb;
  v_rows integer;
begin
  -- Raises when the session is not the caller's or was cancelled; completing
  -- twice returns the same row (idempotent).
  s := public.finish_study_session(p_session_id);

  if s.result is not null then
    return s.result || jsonb_build_object('alreadyFinalized', true);
  end if;

  v_minutes := floor(public.study_session_seconds(s) / 60)::integer;
  v_below := v_minutes < c_min_minutes;
  v_counted := least(v_minutes, c_max_counted);
  v_day := (s.ended_at at time zone c_tz)::date;

  -- Study time (1 XP / minute, daily cap).
  if not v_below then
    select coalesce(sum(x.amount), 0)::integer into v_day_xp
      from public.xp_transactions x
      where x.user_id = v_uid and x.reason = 'study_duration'
        and (x.created_at at time zone c_tz)::date = v_day;
    v_duration_xp := greatest(0, least(v_counted, c_day_xp_cap - v_day_xp));
    if v_duration_xp > 0 then
      insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
        values (v_uid, v_duration_xp, 'study_duration', 'session:' || s.id, s.id)
        on conflict (user_id, idempotency_key) do nothing;
      v_breakdown := v_breakdown || jsonb_build_array(jsonb_build_object(
        'reason', 'study_duration', 'xp', v_duration_xp,
        'label', v_counted || ' min de révision'
          || case when v_duration_xp < v_counted then ' (plafond du jour atteint)' else '' end));
    end if;
  end if;

  select (coalesce(sum(public.study_session_seconds(t)), 0) / 60)::integer into v_day_minutes
    from public.study_sessions t
    where t.user_id = v_uid and t.status = 'completed'
      and (t.ended_at at time zone c_tz)::date = v_day;

  -- Daily goal (once per day).
  v_goal_done := v_day_minutes >= c_goal_minutes;
  if v_goal_done and not v_below then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (v_uid, c_goal_xp, 'daily_goal', 'daily_goal:' || v_day::text, s.id)
      on conflict (user_id, idempotency_key) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 1 then
      v_goal_xp := c_goal_xp;
      v_breakdown := v_breakdown || jsonb_build_array(jsonb_build_object(
        'reason', 'daily_goal', 'xp', c_goal_xp, 'label', 'Objectif du jour atteint'));
    end if;
  end if;

  -- Streak and milestones.
  select * into v_streak from public._streak_stats(v_uid);
  v_milestone := v_streak.current_streak;
  if v_milestone in (7, 21, 30) and v_day_minutes >= c_streak_day_minutes and v_streak.last_day = v_day then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (
        v_uid,
        case v_milestone when 7 then 100 when 21 then 250 else 500 end,
        'streak_milestone', 'streak:' || v_milestone || ':' || v_day::text, s.id)
      on conflict (user_id, idempotency_key) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 1 then
      v_milestone_xp := case v_milestone when 7 then 100 when 21 then 250 else 500 end;
      v_breakdown := v_breakdown || jsonb_build_array(jsonb_build_object(
        'reason', 'streak_milestone', 'xp', v_milestone_xp,
        'label', 'Série de ' || v_milestone || ' jours'));
    end if;
  end if;

  v_earned := v_duration_xp + v_goal_xp + v_milestone_xp;
  select coalesce(sum(x.amount), 0)::integer into v_total
    from public.xp_transactions x where x.user_id = v_uid;

  insert into public.user_stats
    (user_id, total_xp, current_streak, best_streak, last_validated_on, total_minutes, sessions_count, updated_at)
  select v_uid, v_total, v_streak.current_streak, v_streak.best_streak, v_streak.last_day,
         (coalesce(sum(public.study_session_seconds(t)), 0) / 60)::integer, count(*)::integer, now()
    from public.study_sessions t where t.user_id = v_uid and t.status = 'completed'
  on conflict (user_id) do update set
    total_xp = excluded.total_xp,
    current_streak = excluded.current_streak,
    best_streak = excluded.best_streak,
    last_validated_on = excluded.last_validated_on,
    total_minutes = excluded.total_minutes,
    sessions_count = excluded.sessions_count,
    updated_at = excluded.updated_at;

  -- Feed post (visible to friends only while the session is shared).
  if not v_below then
    insert into public.posts (user_id, study_session_id, subject_name, duration_minutes, earned_xp, streak_days)
      values (v_uid, s.id, s.label, v_minutes, v_earned,
              case when v_day_minutes >= c_streak_day_minutes then v_streak.current_streak else 0 end)
      on conflict (study_session_id) do nothing;
    v_post := s.visibility = 'friends';
  end if;

  v_result := jsonb_build_object(
    'sessionId', s.id,
    'subjectName', s.label,
    'durationMinutes', v_minutes,
    'countedMinutes', v_counted,
    'belowMinimum', v_below,
    'earnedXp', v_earned,
    'xpBreakdown', v_breakdown,
    'totalXp', v_total,
    'dailyGoalCompleted', v_goal_done,
    'streak', jsonb_build_object(
      'currentDays', v_streak.current_streak,
      'recordDays', v_streak.best_streak,
      'todayValidated', v_day_minutes >= c_streak_day_minutes,
      'todayMinutes', v_day_minutes,
      'dailyGoalMinutes', c_goal_minutes,
      'dailyGoalCompleted', v_goal_done,
      'lastValidatedOn', v_streak.last_day),
    'postCreated', v_post,
    'alreadyFinalized', false);

  update public.study_sessions set result = v_result where id = s.id;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Minutes per day for the caller (regularity grid). Invoker: RLS applies.
-- ---------------------------------------------------------------------------

create or replace function public.my_daily_minutes(p_days integer default 28)
returns table (day date, minutes integer)
language sql
stable
set search_path = ''
as $$
  select (s.ended_at at time zone 'Europe/Paris')::date,
         (sum(public.study_session_seconds(s)) / 60)::integer
  from public.study_sessions s
  where s.user_id = (select auth.uid()) and s.status = 'completed'
    and s.ended_at >= now() - make_interval(days => least(greatest(p_days, 1), 366) + 1)
  group by 1;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.set_study_session_label(uuid, text)',
    'public.finalize_study_session(uuid)',
    'public.my_daily_minutes(integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;
