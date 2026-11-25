/**
 * Streak DISPLAY helpers (pure). The streak itself is computed by the database
 * (`finish_study_session`) and by `streak.ts`; this only decides what to show
 * from the stored `user_stats` row.
 */

import type { IsoDate } from "@/lib/contracts";
import type { StreakSummary } from "../contracts";
import { nextStreakMilestone } from "./levels";
import { localDate } from "./streak";
import { XP_RULES } from "./xp";

export const APP_TIME_ZONE = "Europe/Paris";
const DAY_MS = 86_400_000;

/** Calendar day "YYYY-MM-DD" of `date` in the given time zone (Europe/Paris by default). */
export function today(date: Date = new Date(), timeZone: string = APP_TIME_ZONE): IsoDate {
  return localDate(date, timeZone);
}

function dayNumber(day: IsoDate): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

/**
 * The stored streak is as of the last finished session. It is still alive when
 * the last validated day is today or yesterday, otherwise it is 0 (a rest day
 * keeps the record, never the current run).
 */
export function effectiveStreakDays(current: number, lastValidatedOn: IsoDate | null, day: IsoDate): number {
  if (!lastValidatedOn || current <= 0) return 0;
  return dayNumber(day) - dayNumber(lastValidatedOn) <= 1 ? current : 0;
}

/** Last `count` calendar days ending at `day` (inclusive), oldest first. */
export function lastDays(day: IsoDate, count: number): IsoDate[] {
  const end = dayNumber(day);
  return Array.from({ length: count }, (_, i) =>
    new Date((end - (count - 1 - i)) * DAY_MS).toISOString().slice(0, 10),
  );
}

export type StatsRow = { current_streak: number; record_streak: number; last_validated_on: IsoDate | null };

export function buildStreakSummary(
  stats: StatsRow,
  todayMinutes: number,
  day: IsoDate,
  goalMinutes: number,
): StreakSummary {
  const currentDays = effectiveStreakDays(stats.current_streak, stats.last_validated_on, day);
  return {
    currentDays,
    recordDays: Math.max(stats.record_streak, currentDays),
    todayValidated: todayMinutes >= XP_RULES.streakDayMinutes,
    todayMinutes,
    dailyGoalMinutes: goalMinutes,
    dailyGoalCompleted: todayMinutes >= goalMinutes,
    nextMilestone: nextStreakMilestone(currentDays),
    lastValidatedOn: stats.last_validated_on,
  };
}

/** Seconds of finished sessions per Paris day, for the regularity grid. */
export function minutesPerDay(
  sessions: readonly { endedAt: string; seconds: number }[],
  timeZone: string = APP_TIME_ZONE,
): { date: IsoDate; minutes: number }[] {
  const byDay = new Map<IsoDate, number>();
  for (const s of sessions) {
    const day = localDate(s.endedAt, timeZone);
    byDay.set(day, (byDay.get(day) ?? 0) + Math.max(0, s.seconds) / 60);
  }
  return [...byDay].map(([date, minutes]) => ({ date, minutes: Math.floor(minutes) }));
}
