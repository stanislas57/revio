-- Layout of the app navigation, chosen in Réglages > Apparence.
-- * Kept in `user_settings`, whose RLS is owner-only (a single "for all to authenticated" policy): nobody else can
--   read or change it, so no new policy or grant is needed.
-- * Nullable: null = never chosen (the app then uses the left sidebar). 'sidebar' = left sidebar, 'top' = bar at the
--   top of the page.
alter table public.user_settings
  add column nav_layout text check (nav_layout in ('sidebar', 'top'));

comment on column public.user_settings.nav_layout is
  'Navigation layout chosen by the user: sidebar (left) or top (horizontal bar). null = not chosen. Owner-only.';
