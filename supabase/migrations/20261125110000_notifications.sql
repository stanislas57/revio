-- Revio — internal notifications (S-21): friend request, request accepted, "bravo" on a post.
--
-- * Written ONLY by triggers (security definer): clients can read their own, mark them read
--   (column `read_at` only) and delete them. They can never create one for somebody else.
-- * No duplicates: `unique (user_id, dedupe_key)`. A "bravo" removed then given again does not
--   notify twice. A notification never carries a grade, a subject or a duration.
-- * Preferences are enforced HERE, not only hidden in the UI: a kind the recipient switched
--   off is never inserted.

alter table public.user_settings
  add column notify_friend_requests boolean not null default true,
  add column notify_friend_accepted boolean not null default true,
  add column notify_reactions boolean not null default true;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('friend_request', 'friend_accepted', 'post_reaction')),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 200),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: owner reads"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications: owner marks read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notifications: owner deletes"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Single entry point for the triggers; honours the recipient's preference for that kind.
create or replace function public._notify(p_user uuid, p_kind text, p_actor uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if p_user = p_actor then
    return;
  end if;
  select case p_kind
           when 'friend_request' then coalesce(s.notify_friend_requests, true)
           when 'friend_accepted' then coalesce(s.notify_friend_accepted, true)
           else coalesce(s.notify_reactions, true)
         end
    into allowed
    from (select 1) x left join public.user_settings s on s.user_id = p_user;
  if coalesce(allowed, true) then
    insert into public.notifications (user_id, kind, actor_id, dedupe_key)
      values (p_user, p_kind, p_actor, p_key)
      on conflict (user_id, dedupe_key) do nothing;
  end if;
end;
$$;

revoke execute on function public._notify(uuid, text, uuid, text) from public, anon, authenticated;

create or replace function public._notify_friendship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public._notify(new.addressee_id, 'friend_request', new.requester_id, 'friend_request:' || new.id);
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status <> 'accepted' then
    perform public._notify(new.requester_id, 'friend_accepted', new.addressee_id, 'friend_accepted:' || new.id);
    -- The request is answered: it no longer needs the addressee's attention.
    delete from public.notifications
      where user_id = new.addressee_id and dedupe_key = 'friend_request:' || new.id;
  elsif tg_op = 'DELETE' then
    -- Declined or cancelled: the request notification would point to nothing.
    delete from public.notifications where dedupe_key = 'friend_request:' || old.id;
    return old;
  end if;
  return new;
end;
$$;

create or replace function public._notify_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select p.user_id into owner from public.posts p where p.id = new.post_id;
  if owner is not null then
    perform public._notify(owner, 'post_reaction', new.user_id, 'reaction:' || new.post_id || ':' || new.user_id);
  end if;
  return new;
end;
$$;

revoke execute on function public._notify_friendship() from public, anon, authenticated;
revoke execute on function public._notify_reaction() from public, anon, authenticated;

create trigger friendships_notify after insert or update or delete on public.friendships
  for each row execute function public._notify_friendship();
create trigger post_reactions_notify after insert on public.post_reactions
  for each row execute function public._notify_reaction();
