-- Revio — academic module (owner: Stan).
-- Adds the fields needed by subjects / grades, a per-user academic target and
-- a simple exams table. Everything stays strictly private (owner only).
-- Coefficient 0 becomes allowed on subjects and grades: a 0-weight item is
-- kept for information but does not count in averages (Revio convention).

-- ---------------------------------------------------------------------------
-- subjects: UE, semester, target, archive, template marker
-- ---------------------------------------------------------------------------

alter table public.subjects
  drop constraint subjects_coefficient_check,
  add constraint subjects_coefficient_check check (coefficient >= 0 and coefficient <= 100),
  add column teaching_unit text check (teaching_unit is null or char_length(teaching_unit) between 1 and 80),
  add column semester text check (semester is null or char_length(semester) between 1 and 40),
  add column target_average numeric(4, 2) check (target_average is null or target_average between 0 and 20),
  add column archived_at timestamptz,
  -- True while the subject comes untouched from a sample template (e.g. BUT GEA).
  add column is_template boolean not null default false,
  add column updated_at timestamptz not null default now();

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- grades: evaluation type, zero coefficient
-- ---------------------------------------------------------------------------

alter table public.grades
  drop constraint grades_coefficient_check,
  add constraint grades_coefficient_check check (coefficient >= 0 and coefficient <= 100),
  add column kind text not null default 'other'
    check (kind in ('exam', 'continuous', 'practical', 'oral', 'project', 'other')),
  add column updated_at timestamptz not null default now();

create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- academic_settings: one row per user (overall target average)
-- ---------------------------------------------------------------------------

create table public.academic_settings (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  target_average numeric(4, 2) check (target_average is null or target_average between 0 and 20),
  updated_at timestamptz not null default now()
);

create trigger academic_settings_set_updated_at
  before update on public.academic_settings
  for each row execute function public.set_updated_at();

alter table public.academic_settings enable row level security;

create policy "academic_settings: owner only"
  on public.academic_settings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- exams: upcoming evaluations (private)
-- ---------------------------------------------------------------------------

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(title) between 1 and 120),
  exam_on date not null,
  created_at timestamptz not null default now(),
  -- An exam can only point to a subject owned by the same user.
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete set null (subject_id)
);

create index exams_user_date_idx on public.exams (user_id, exam_on);

alter table public.exams enable row level security;

create policy "exams: owner only"
  on public.exams for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
