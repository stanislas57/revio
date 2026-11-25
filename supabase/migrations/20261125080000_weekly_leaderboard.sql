-- Revio — weekly leaderboard between friends (S-19).
--
-- XP only: the function returns identity + weekly XP, never a grade, average or subject.
-- `xp_transactions` stays owner-only under RLS, so friends' totals are read through this single
-- security definer function, which only ever returns the caller and their ACCEPTED friends who
-- take part. Leaving the board is enforced here, not only hidden in the UI: someone who left
-- is absent for everybody, and sees no board themselves.

alter table public.user_settings
  add column show_in_leaderboard boolean not null default true;

-- The week runs Monday 00:00 -> next Monday 00:00 in the CALLER's time zone (date_trunc('week')
-- starts on Monday and is DST-safe because it works on the local wall-clock time).
create or replace function public.weekly_leaderboard()
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  weekly_xp integer,
  rank integer,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  tz text;
  week_start timestamptz;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  -- Left the board: nothing to show (and nobody sees them either).
  if not coalesce((select s.show_in_leaderboard from public.user_settings s where s.user_id = uid), true) then
    return;
  end if;
  tz := coalesce((select s.timezone from public.user_settings s where s.user_id = uid), 'Europe/Paris');
  week_start := date_trunc('week', now() at time zone tz) at time zone tz;

  return query
  with members as (
    select uid as member_id
    union
    select case when f.requester_id = uid then f.addressee_id else f.requester_id end
    from public.friendships f
    where f.status = 'accepted' and uid in (f.requester_id, f.addressee_id)
  ),
  taking_part as (
    select m.member_id
    from members m
    where coalesce((select s.show_in_leaderboard from public.user_settings s where s.user_id = m.member_id), true)
  ),
  scored as (
    select t.member_id,
           greatest(coalesce((
             select sum(x.amount)
             from public.xp_transactions x
             where x.user_id = t.member_id and x.created_at >= week_start
           ), 0), 0)::integer as xp
    from taking_part t
  )
  select p.id, p.username, p.display_name, p.avatar_url, s.xp,
         (rank() over (order by s.xp desc))::integer,
         p.id = uid
  from scored s
  join public.profiles p on p.id = s.member_id
  order by 6, p.username nulls last;
end;
$$;

revoke execute on function public.weekly_leaderboard() from public, anon;
grant execute on function public.weekly_leaderboard() to authenticated;
