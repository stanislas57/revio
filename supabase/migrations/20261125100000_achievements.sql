-- Revio — achievements (S-18): catalogue, automatic award, progress.
--
-- * The catalogue lives here, in one SQL function (single source for ids, texts and targets).
-- * Awards are written ONLY by `_award_achievements()`, fired by triggers when the user's stats
--   change (every finished session goes through `finish_study_session`, which updates
--   `user_stats`) or when a friendship becomes accepted. The primary key makes an award
--   non-repeatable, whatever happens later (`on conflict do nothing`).
-- * Clients can read their own awards and nothing else: no insert/update/delete grant.
-- * Achievements never involve a grade, an average or a subject.

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null check (char_length(achievement_id) between 1 and 64),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "user_achievements: owner can read"
  on public.user_achievements for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.user_achievements from anon;
revoke insert, update, delete on public.user_achievements from authenticated;
grant select on public.user_achievements to authenticated;

-- metric: 'sessions' (finished sessions), 'streak' (record streak, days), 'seconds' (study time),
--         'xp' (total XP), 'friends' (accepted friends).
create or replace function public._achievement_catalog()
returns table (id text, name text, description text, category text, metric text, target integer)
language sql
immutable
set search_path = ''
as $$
  select * from (values
    ('first_session', 'Premier pas',     'Terminer une première séance.',          'volume',     'sessions', 1),
    ('sessions_25',   'Persévérant',     'Terminer 25 séances.',                   'volume',     'sessions', 25),
    ('hours_10',      'Échauffé',        'Cumuler 10 heures de révision.',         'volume',     'seconds',  36000),
    ('hours_100',     'Marathonien',     'Cumuler 100 heures de révision.',        'volume',     'seconds',  360000),
    ('streak_7',      'Régulier',        'Atteindre un streak de 7 jours.',        'regularity', 'streak',   7),
    ('streak_30',     'Inarrêtable',     'Atteindre un streak de 30 jours.',       'regularity', 'streak',   30),
    ('streak_100',    'Indestructible',  'Atteindre une série de 100 jours.',      'regularity', 'streak',   100),
    ('level_expert',  'Expert',          'Atteindre le niveau Expert (5 000 XP).', 'level',      'xp',       5000),
    ('xp_50000',      'Légende',         'Cumuler 50 000 XP.',                     'level',      'xp',       50000),
    ('first_friend',  'Premier ami',     'Avoir un premier ami sur Revio.',        'social',     'friends',  1),
    ('friends_5',     'Entouré',         'Avoir 5 amis sur Revio.',                'social',     'friends',  5)
  ) as t(id, name, description, category, metric, target);
$$;

revoke execute on function public._achievement_catalog() from public, anon;
grant execute on function public._achievement_catalog() to authenticated;

-- Current value of each metric for one user.
create or replace function public._achievement_metrics(p_user uuid)
returns table (metric text, value bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select 'sessions', count(*) from public.study_sessions where user_id = p_user and status = 'completed'
  union all
  select 'streak', coalesce(max(record_streak), 0) from public.user_stats where user_id = p_user
  union all
  select 'seconds', coalesce(max(total_study_seconds), 0) from public.user_stats where user_id = p_user
  union all
  select 'xp', coalesce(max(total_xp), 0) from public.user_stats where user_id = p_user
  union all
  select 'friends', count(*) from public.friendships
    where status = 'accepted' and p_user in (requester_id, addressee_id);
$$;

revoke execute on function public._achievement_metrics(uuid) from public, anon, authenticated;

create or replace function public._award_achievements(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_achievements (user_id, achievement_id)
  select p_user, c.id
  from public._achievement_catalog() c
  join public._achievement_metrics(p_user) m on m.metric = c.metric
  where m.value >= c.target
  on conflict do nothing;
$$;

revoke execute on function public._award_achievements(uuid) from public, anon, authenticated;

create or replace function public._award_after_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._award_achievements(new.user_id);
  return new;
end;
$$;

create or replace function public._award_after_friendship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' then
    perform public._award_achievements(new.requester_id);
    perform public._award_achievements(new.addressee_id);
  end if;
  return new;
end;
$$;

revoke execute on function public._award_after_stats() from public, anon, authenticated;
revoke execute on function public._award_after_friendship() from public, anon, authenticated;

create trigger user_stats_award after insert or update on public.user_stats
  for each row execute function public._award_after_stats();
create trigger friendships_award after insert or update on public.friendships
  for each row execute function public._award_after_friendship();

-- Contract `Achievement` (src/modules/gamification/contracts.ts), caller only, catalogue order.
-- Progress is shown while locked; an obtained achievement has no progress bar (progress: null).
create or replace function public.my_achievements()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  -- Catches up anything earned before this migration (idempotent).
  perform public._award_achievements(uid);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'category', c.category,
      'unlockedAt', u.unlocked_at,
      'progress', case when u.unlocked_at is not null then null
        else jsonb_build_object('current', least(m.value, c.target), 'target', c.target) end
    ) order by c.ord)
    from (select *, row_number() over () as ord from public._achievement_catalog()) c
    join public._achievement_metrics(uid) m on m.metric = c.metric
    left join public.user_achievements u on u.user_id = uid and u.achievement_id = c.id
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.my_achievements() from public, anon;
grant execute on function public.my_achievements() to authenticated;
