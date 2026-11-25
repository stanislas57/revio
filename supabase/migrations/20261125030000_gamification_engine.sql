-- Revio — gamification engine (tasks S-05 / S-10 data, decisions D-14, D-15, D-16, D-18).
-- finish_study_session now grants XP, updates the streak and public stats and
-- creates the feed post, in one transaction, idempotently.
-- Rules mirror src/modules/gamification/domain/xp.ts and streak.ts (Revio
-- convention, not an official rule). Keep both in sync.

-- ---------------------------------------------------------------------------
-- user_settings (private): time zone, daily goal, sharing preferences
-- ---------------------------------------------------------------------------

create table public.user_settings (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  timezone text not null default 'Europe/Paris' check (char_length(timezone) between 1 and 64),
  daily_goal_minutes integer not null default 30 check (daily_goal_minutes between 10 and 600),
  auto_post boolean not null default true,
  -- D-16: the subject name is copied into feed posts only if the user opts in.
  share_subject_in_feed boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function public.check_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'unknown time zone %', new.timezone using errcode = '22023';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_check
  before insert or update on public.user_settings
  for each row execute function public.check_timezone();

alter table public.user_settings enable row level security;

create policy "user_settings: owner only"
  on public.user_settings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- xp_transactions: reasons used by the engine
-- ---------------------------------------------------------------------------

alter table public.xp_transactions
  drop constraint xp_transactions_reason_check,
  add constraint xp_transactions_reason_check check (reason in (
    'study_duration', 'daily_goal', 'streak_milestone', 'planned_session',
    'session_completed', 'streak_bonus', 'challenge', 'adjustment'
  ));

-- ---------------------------------------------------------------------------
-- user_stats: public game data (owner and friends), written by the engine only
-- ---------------------------------------------------------------------------

create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  record_streak integer not null default 0 check (record_streak >= 0),
  last_validated_on date,
  total_study_seconds bigint not null default 0 check (total_study_seconds >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

create policy "user_stats: owner or friends can read"
  on public.user_stats for select to authenticated
  using (user_id = (select auth.uid()) or public.are_friends((select auth.uid()), user_id));

revoke insert, update, delete on public.user_stats from authenticated, anon;

-- ---------------------------------------------------------------------------
-- posts (feed) and post_reactions
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'study_session_completed' check (type in ('study_session_completed')),
  -- One post per session at most (idempotence).
  study_session_id uuid unique references public.study_sessions (id) on delete cascade,
  -- Never any grade here.
  subject_name text check (subject_name is null or char_length(subject_name) <= 80),
  duration_minutes integer not null check (duration_minutes >= 0),
  earned_xp integer not null check (earned_xp >= 0),
  streak_days integer not null check (streak_days >= 0),
  created_at timestamptz not null default now()
);

create index posts_user_created_idx on public.posts (user_id, created_at desc);

alter table public.posts enable row level security;

create policy "posts: author or friends can read"
  on public.posts for select to authenticated
  using (user_id = (select auth.uid()) or public.are_friends((select auth.uid()), user_id));

create policy "posts: author deletes"
  on public.posts for delete to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update on public.posts from authenticated, anon;

create table public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_reactions enable row level security;

-- The posts subquery is itself filtered by the posts RLS: you only see or add
-- reactions on posts you are allowed to read.
create policy "post_reactions: readable with the post"
  on public.post_reactions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy "post_reactions: react to a visible post"
  on public.post_reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id));

create policy "post_reactions: remove own"
  on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke update on public.post_reactions from authenticated, anon;

-- ---------------------------------------------------------------------------
-- finish_study_session: close + rewards, returns the official summary (jsonb)
-- ---------------------------------------------------------------------------

alter table public.study_sessions add column result jsonb;

drop function public.finish_study_session(uuid);

create function public.finish_study_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions := public._own_session(p_session_id);
  uid uuid := s.user_id;
  st public.user_settings;
  tz text;
  goal integer;
  day date;
  secs integer;
  dmin integer;
  below boolean;
  dur_xp_today integer;
  dur_xp integer;
  minutes_before integer;
  goal_done boolean;
  validated date[];
  cur date;
  streak integer := 0;
  record integer;
  bonus integer;
  breakdown jsonb := '[]'::jsonb;
  earned integer := 0;
  total integer;
  total_before integer;
  subject text;
  post_created boolean := false;
  r jsonb;
  n integer;
begin
  -- Idempotence: a finished session returns its stored summary.
  if s.status = 'completed' then
    return coalesce(s.result, '{}'::jsonb) || jsonb_build_object('already_finalized', true);
  end if;
  if s.status <> 'in_progress' then
    raise exception 'session was cancelled' using errcode = '55000';
  end if;

  select * into st from public.user_settings where user_id = uid;
  tz := coalesce(st.timezone, 'Europe/Paris');
  goal := coalesce(st.daily_goal_minutes, 30);
  select coalesce(sum(amount), 0) into total_before from public.xp_transactions where user_id = uid;

  update public.study_sessions
    set status = 'completed',
        ended_at = now(),
        paused_seconds = paused_seconds
          + coalesce(floor(extract(epoch from now() - paused_at))::integer, 0),
        paused_at = null
    where id = s.id returning * into s;

  secs := public.study_session_seconds(s);
  dmin := secs / 60;
  below := dmin < 5;
  -- D-15: the session belongs to the local day it ended.
  day := (s.ended_at at time zone tz)::date;

  -- Duration XP: 1 per minute, at most 180 counted minutes, at most 300 per day.
  select coalesce(sum(x.amount), 0) into dur_xp_today
    from public.xp_transactions x
    where x.user_id = uid and x.reason = 'study_duration'
      and (x.created_at at time zone tz)::date = day;
  dur_xp := case when below then 0 else least(dmin, 180, greatest(0, 300 - dur_xp_today)) end;
  if dur_xp > 0 then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (uid, dur_xp, 'study_duration', 'session:' || s.id, s.id);
    breakdown := breakdown || jsonb_build_object('reason', 'study_duration', 'xp', dur_xp);
  end if;

  -- Daily goal: +50 once per local day.
  select coalesce(sum(public.study_session_seconds(o)), 0) / 60 into minutes_before
    from public.study_sessions o
    where o.user_id = uid and o.status = 'completed' and o.id <> s.id
      and (o.ended_at at time zone tz)::date = day;
  goal_done := not below and minutes_before + dmin >= goal;
  if goal_done then
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (uid, 50, 'daily_goal', 'daily_goal:' || day, s.id)
      on conflict (user_id, idempotency_key) do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      breakdown := breakdown || jsonb_build_object('reason', 'daily_goal', 'xp', 50);
    end if;
  end if;

  -- Streak: consecutive local days with at least 10 minutes of finished sessions.
  select array_agg(d) into validated from (
    select (o.ended_at at time zone tz)::date as d
      from public.study_sessions o
      where o.user_id = uid and o.status = 'completed'
      group by 1
      having sum(public.study_session_seconds(o)) >= 600
  ) v;
  validated := coalesce(validated, '{}');
  cur := case when day = any (validated) then day else day - 1 end;
  while cur = any (validated) loop
    streak := streak + 1;
    cur := cur - 1;
  end loop;

  bonus := case streak when 7 then 100 when 21 then 250 when 30 then 500 else 0 end;
  if not below and bonus > 0 then
    -- Key includes the first day of the streak: once per streak and milestone.
    insert into public.xp_transactions (user_id, amount, reason, idempotency_key, study_session_id)
      values (uid, bonus, 'streak_milestone', 'streak:' || streak || ':' || (cur + 1), s.id)
      on conflict (user_id, idempotency_key) do nothing;
    get diagnostics n = row_count;
    if n > 0 then
      breakdown := breakdown || jsonb_build_object('reason', 'streak_milestone', 'xp', bonus, 'days', streak);
    end if;
  end if;

  select coalesce(sum((b ->> 'xp')::integer), 0) into earned from jsonb_array_elements(breakdown) b;
  total := total_before + earned;

  insert into public.user_stats as u (user_id, total_xp, current_streak, record_streak, last_validated_on, total_study_seconds)
    values (uid, total, streak, streak,
            case when day = any (validated) then day else (select max(x) from unnest(validated) x) end, secs)
    on conflict (user_id) do update set
      total_xp = excluded.total_xp,
      current_streak = excluded.current_streak,
      record_streak = greatest(u.record_streak, excluded.current_streak),
      last_validated_on = excluded.last_validated_on,
      total_study_seconds = u.total_study_seconds + excluded.total_study_seconds,
      updated_at = now()
    returning record_streak into record;

  if s.subject_id is not null then
    select name into subject from public.subjects where id = s.subject_id and user_id = uid;
  end if;

  if not below and s.visibility = 'friends' and coalesce(st.auto_post, true) then
    insert into public.posts (user_id, study_session_id, subject_name, duration_minutes, earned_xp, streak_days)
      values (uid, s.id, case when coalesce(st.share_subject_in_feed, false) then subject end, dmin, earned, streak)
      on conflict (study_session_id) do nothing;
    get diagnostics n = row_count;
    post_created := n > 0;
  end if;

  r := jsonb_build_object(
    'session_id', s.id,
    'already_finalized', false,
    'subject_name', subject,
    'duration_seconds', secs,
    'duration_minutes', dmin,
    'counted_minutes', dur_xp,
    'below_minimum', below,
    'earned_xp', earned,
    'breakdown', breakdown,
    'total_xp_before', total_before,
    'total_xp', total,
    'streak_days', streak,
    'record_days', record,
    'day', day,
    'today_minutes', minutes_before + dmin,
    'today_validated', day = any (validated),
    'daily_goal_minutes', goal,
    'daily_goal_completed', goal_done,
    'post_created', post_created
  );
  update public.study_sessions set result = r where id = s.id;
  return r;
end;
$$;

revoke execute on function public.finish_study_session(uuid) from public, anon;
grant execute on function public.finish_study_session(uuid) to authenticated;
