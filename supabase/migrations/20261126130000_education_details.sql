-- Study level and (optional) gender, asked during the onboarding and editable in "Mes informations".
-- * Both stay in `user_education`, whose RLS is owner-only (read, insert, update, delete): nobody else, friends
--   included, can read them. No new grant is needed.
-- * Both are nullable: null = not answered. Gender is never required; 'prefer_not' records an explicit
--   "Je préfère ne pas répondre". Revio may have minor users: nothing else is collected and nothing is shown
--   to other users.
alter table public.user_education
  add column study_level text check (
    study_level in ('seconde', 'premiere', 'terminale', 'bac1', 'bac2', 'bac3', 'master', 'other')
  ),
  add column gender text check (gender in ('female', 'male', 'non_binary', 'prefer_not'));

comment on column public.user_education.study_level is
  'Year of study chosen by the user (seconde → master, or other). Owner-only, never shown to friends.';
comment on column public.user_education.gender is
  'Optional, owner-only. null = not answered; prefer_not = explicit "Je préfère ne pas répondre".';
