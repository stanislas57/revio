-- Revio — agenda (owner: Stan).
-- Private calendar events: revision slots, classes, unavailabilities.
-- Dates and times are "wall clock" values in the user's own time zone
-- (no timestamptz): a 18:00 slot stays at 18:00 across daylight-saving changes
-- and a simple recurrence is easy to expand. Events do not cross midnight.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(title) between 1 and 120),
  kind text not null default 'study' check (kind in ('study', 'class', 'unavailable', 'other')),
  -- First day, and last day of the series (equal to starts_on when it does not repeat).
  starts_on date not null,
  last_on date not null,
  -- Both null = all-day event.
  start_time time,
  end_time time,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((start_time is null) = (end_time is null)),
  check (end_time is null or end_time > start_time),
  check (last_on >= starts_on),
  -- A series is bounded (at most one year) so it can always be expanded cheaply.
  check (last_on <= starts_on + 366),
  check (recurrence <> 'none' or last_on = starts_on),
  -- An event can only point to a subject owned by the same user.
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

create index calendar_events_user_range_idx on public.calendar_events (user_id, starts_on, last_on);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "calendar_events: owner only"
  on public.calendar_events for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.calendar_events to authenticated;
