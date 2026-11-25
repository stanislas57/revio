/**
 * XP and streak rules — DISPLAY COPY ONLY.
 * The source of truth is the SQL function `complete_study_session`
 * (supabase/migrations/20261125012529_focus_xp_social.sql). Keep both in sync.
 * The browser never grants XP.
 */
export const XP_PER_MINUTE = 1;
export const SESSION_XP_CAP = 240;
/** Minutes of completed sessions needed for a day to count in the streak. */
export const STREAK_DAY_MIN_MINUTES = 10;

export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 21, 30, 50, 100, 200, 365];
export const STREAK_BONUS_XP: Readonly<Record<number, number>> = { 7: 100, 21: 250, 30: 500 };

export type NextMilestone = { days: number; remaining: number; bonusXp: number | null };

/** Next streak milestone strictly above the current streak, or null after the last one. */
export function nextStreakMilestone(streak: number): NextMilestone | null {
  const days = STREAK_MILESTONES.find((m) => m > streak);
  if (days === undefined) return null;
  return { days, remaining: days - Math.max(0, streak), bonusXp: STREAK_BONUS_XP[days] ?? null };
}
