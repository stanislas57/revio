/**
 * Streak display helpers (pure). The streak itself is computed by the database
 * (finalize_study_session); this only decides what to show.
 */

import type { IsoDate } from "@/lib/contracts";
import type { StreakSummary } from "../contracts";
import { nextStreakMilestone } from "./levels";

export const STREAK_DAY_MIN_MINUTES = 10;
export const DAILY_GOAL_MINUTES = 30;
/** XP bonus granted by the server at some milestones (decision D-14). */
export const STREAK_BONUS_XP: Readonly<Record<number, number>> = { 7: 100, 21: 250, 30: 500 };

const DAY_MS = 86_400_000;

/** Calendar day "YYYY-MM-DD" of `date` in the Europe/Paris time zone. */
export function parisDay(date: Date): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(date);
}

function dayNumber(day: IsoDate): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

/**
 * The stored streak is as of the last finalized session. It is still alive when
 * the last validated day is today or yesterday, otherwise it is 0 (a rest day
 * keeps the record, never the current run).
 */
export function effectiveStreakDays(
  current: number,
  lastValidatedOn: IsoDate | null,
  today: IsoDate,
): number {
  if (!lastValidatedOn || current <= 0) return 0;
  return dayNumber(today) - dayNumber(lastValidatedOn) <= 1 ? current : 0;
}

/** Last `count` calendar days ending at `today` (inclusive), oldest first. */
export function lastDays(today: IsoDate, count: number): IsoDate[] {
  const end = dayNumber(today);
  return Array.from({ length: count }, (_, i) =>
    new Date((end - (count - 1 - i)) * DAY_MS).toISOString().slice(0, 10),
  );
}

export function buildStreakSummary(
  stats: { current_streak: number; best_streak: number; last_validated_on: IsoDate | null },
  todayMinutes: number,
  today: IsoDate,
): StreakSummary {
  const base = effectiveStreakDays(stats.current_streak, stats.last_validated_on, today);
  const todayValidated = todayMinutes >= STREAK_DAY_MIN_MINUTES;
  // Today's session may not be reflected in `base` yet when the day is not validated.
  const currentDays = base;
  return {
    currentDays,
    recordDays: Math.max(stats.best_streak, currentDays),
    todayValidated,
    todayMinutes,
    dailyGoalMinutes: DAILY_GOAL_MINUTES,
    dailyGoalCompleted: todayMinutes >= DAILY_GOAL_MINUTES,
    nextMilestone: nextStreakMilestone(currentDays),
    lastValidatedOn: stats.last_validated_on,
  };
}
