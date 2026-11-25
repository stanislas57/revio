-- Revio — study statistics (S-20): one call per screen.
--
-- my_study_stats(p_days) returns, for the CALLER only, the numbers of the StudyStats contract
-- (src/modules/focus/contracts.ts) as jsonb: today / week (Monday-based) / month / total minutes,
-- sessions count and average, minutes per subject and a daily series of the last p_days local
-- days (user's time zone). Only COMPLETED sessions count; paused time is excluded. SECURITY
-- INVOKER: RLS still applies, and the explicit user_id filter keeps friends' shared sessions out.
-- Subjects are owner-only, so names and colours only ever come back to their owner.

create or replace function public.my_study_stats(p_days integer default 30)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  tz text;
  today date;
  first_day date;
  week_first date;
  month_first date;
  result jsonb;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_days is null or p_days < 7 or p_days > 365 then
    raise exception 'p_days must be between 7 and 365' using errcode = '22023';
  end if;
  tz := coalesce((select s.timezone from public.user_settings s where s.user_id = uid), 'Europe/Paris');
  today := (now() at time zone tz)::date;
  first_day := today - (p_days - 1);
  week_first := date_trunc('week', today::timestamp)::date;
  month_first := date_trunc('month', today::timestamp)::date;

  with done as (
    select s.id, s.subject_id,
           (s.ended_at at time zone tz)::date as day,
           public.study_session_seconds(s) as secs
    from public.study_sessions s
    where s.user_id = uid and s.status = 'completed' and s.ended_at is not null
  ),
  days as (
    select d::date as day from generate_series(first_day, today, interval '1 day') d
  ),
  xp as (
    select (x.created_at at time zone tz)::date as day, sum(x.amount)::integer as xp
    from public.xp_transactions x
    where x.user_id = uid and (x.created_at at time zone tz)::date >= first_day
    group by 1
  )
  select jsonb_build_object(
    'todayMinutes',   coalesce((select sum(secs) / 60 from done where day = today), 0),
    'weekMinutes',    coalesce((select sum(secs) / 60 from done where day >= week_first), 0),
    'monthMinutes',   coalesce((select sum(secs) / 60 from done where day >= month_first), 0),
    'totalMinutes',   coalesce((select sum(secs) / 60 from done), 0),
    'sessionsCount',  (select count(*) from done),
    'averageSessionMinutes', coalesce((select (avg(secs) / 60)::integer from done), 0),
    'bySubject', coalesce((
      select jsonb_agg(jsonb_build_object(
               'subjectId', t.subject_id, 'name', t.name, 'color', t.color, 'minutes', t.minutes
             ) order by t.minutes desc)
      from (
        select d.subject_id,
               coalesce(sub.name, 'Sans matière') as name,
               sub.color,
               (sum(d.secs) / 60)::integer as minutes
        from done d
        left join public.subjects sub on sub.id = d.subject_id and sub.user_id = uid
        where d.day >= first_day
        group by d.subject_id, sub.name, sub.color
      ) t
    ), '[]'::jsonb),
    'daily', (
      select jsonb_agg(jsonb_build_object(
               'date', to_char(dy.day, 'YYYY-MM-DD'),
               'minutes', coalesce((select sum(secs) / 60 from done where done.day = dy.day), 0)::integer,
               'xp', coalesce((select xp.xp from xp where xp.day = dy.day), 0)
             ) order by dy.day)
      from days dy
    )
  ) into result;
  return result;
end;
$$;

revoke execute on function public.my_study_stats(integer) from public, anon;
grant execute on function public.my_study_stats(integer) to authenticated;
