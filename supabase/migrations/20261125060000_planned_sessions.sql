-- Revio — basic planning (owner: Stan).
-- A planned revision session is a calendar event of kind 'study' with a plan_status:
--   recommended : proposed by Revio, replaced at each replanning
--   accepted    : kept by the user, never replaced by a replanning
--   locked      : kept and meant not to move (e.g. agreed with a friend, a teacher)
-- plan_status is null for events the user typed by hand.

alter table public.calendar_events
  add column plan_status text check (plan_status in ('recommended', 'accepted', 'locked')),
  add column plan_reason text check (plan_reason is null or char_length(plan_reason) <= 400),
  -- A planned session is a one-off, timed revision slot.
  add constraint calendar_events_plan_shape check (
    plan_status is null
    or (kind = 'study' and recurrence = 'none' and start_time is not null)
  );

create index calendar_events_plan_idx on public.calendar_events (user_id, starts_on)
  where plan_status is not null;
