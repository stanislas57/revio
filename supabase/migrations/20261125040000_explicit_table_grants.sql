-- Revio — explicit table privileges for signed-in users.
--
-- Hosted Supabase projects no longer grant table privileges to `authenticated`
-- automatically, so without this every query failed with "permission denied".
-- RLS policies still decide WHICH rows; these grants only decide which
-- operations can even be attempted. `anon` gets nothing: the app is
-- sign-in only. Writes that must go through SQL functions (XP, stats, posts,
-- session timing) are deliberately NOT granted.

grant usage on schema public to authenticated;

-- Identity: read everyone's public identity, edit only these own columns.
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;

-- Friendships: update stays limited to (status, responded_at) (see initial schema).
grant select, insert, delete on public.friendships to authenticated;

-- Private owner-only data.
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.grades to authenticated;
grant select, insert, update, delete on public.exams to authenticated;
grant select, insert, update, delete on public.academic_settings to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

-- Sessions: created and timed by SQL functions only; the client can read and delete.
grant select, delete on public.study_sessions to authenticated;

-- XP and stats are written by SQL functions only.
grant select on public.xp_transactions to authenticated;
grant select on public.user_stats to authenticated;

-- Feed: posts are created by finish_study_session; reactions by the client.
grant select, delete on public.posts to authenticated;
grant select, insert, delete on public.post_reactions to authenticated;
