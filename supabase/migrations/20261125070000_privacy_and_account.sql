-- Revio — privacy settings (S-15) and account deletion (S-14).
--
-- 1. Two new private settings, enforced by the database (not only hidden in the UI):
--    - show_live_status: when off, friends can no longer read the user's RUNNING session
--      ("Amis en révision"); finished sessions follow `visibility` as before.
--    - default_visibility: the visibility of a new session when the client does not choose one.
-- 2. delete_my_account(): a user deletes their own account and, by cascade, all their data.
--    Done in SQL (security definer) so no service-role key ever reaches the app.

alter table public.user_settings
  add column show_live_status boolean not null default true,
  add column default_visibility text not null default 'friends'
    check (default_visibility in ('private', 'friends'));

-- user_settings is owner-only under RLS, so the policy of ANOTHER user's session needs a
-- definer function to read this one flag. It returns nothing but that boolean.
create or replace function public.shares_live_status(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.show_live_status from public.user_settings s where s.user_id = p_user), true);
$$;

revoke execute on function public.shares_live_status(uuid) from public, anon;
grant execute on function public.shares_live_status(uuid) to authenticated;

drop policy "study_sessions: owner or friends (if shared) can read" on public.study_sessions;
create policy "study_sessions: owner or friends (if shared) can read"
  on public.study_sessions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      visibility = 'friends'
      and public.are_friends((select auth.uid()), user_id)
      and (status <> 'in_progress' or public.shares_live_status(user_id))
    )
  );

-- A new session takes the user's default visibility unless the caller chooses one.
create or replace function public.start_study_session(
  p_mode text default 'free',
  p_subject_id uuid default null,
  p_planned_minutes integer default null,
  p_visibility text default null
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
  update public.study_sessions
    set status = 'abandoned', ended_at = now(), paused_at = null
    where user_id = uid and status = 'in_progress'
      and last_heartbeat_at < now() - interval '12 hours';

  insert into public.study_sessions (user_id, subject_id, mode, planned_minutes, visibility, started_at)
    values (
      uid, p_subject_id, p_mode, p_planned_minutes,
      coalesce(
        p_visibility,
        (select u.default_visibility from public.user_settings u where u.user_id = uid),
        'friends'
      ),
      now()
    )
    returning * into s;
  return s;
end;
$$;

-- Account deletion: removing the auth user cascades to profile, settings, subjects, grades,
-- exams, events, sessions, XP, stats, posts, reactions and friendships.
create or replace function public.delete_my_account()
returns void
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
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
