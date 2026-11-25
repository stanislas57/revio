/**
 * Streak — Revio convention (decision D-15).
 * A day counts when finished sessions total at least XP_RULES.streakDayMinutes.
 * A session belongs to the local day (user's time zone) on which it ENDED,
 * so a session crossing midnight counts for the day it finished.
 */

import type { IsoDate } from "@/lib/contracts";
import { XP_RULES } from "./xp";

/** Local calendar day "YYYY-MM-DD" of an instant in an IANA time zone (DST-safe). */
export function localDate(instant: Date | string, timeZone: string): IsoDate {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) throw new RangeError("Date invalide.");
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(day: IsoDate, delta: number): IsoDate {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export type FinishedSession = { endedAt: string; seconds: number };

/** Study minutes per local day. */
export function minutesByDay(sessions: readonly FinishedSession[], timeZone: string): Map<IsoDate, number> {
  const byDay = new Map<IsoDate, number>();
  for (const s of sessions) {
    const day = localDate(s.endedAt, timeZone);
    byDay.set(day, (byDay.get(day) ?? 0) + Math.max(0, s.seconds) / 60);
  }
  return byDay;
}

export type StreakState = {
  currentDays: number;
  recordDays: number;
  todayValidated: boolean;
  todayMinutes: number;
  lastValidatedOn: IsoDate | null;
};

/**
 * Current streak: consecutive validated days ending today, or ending yesterday
 * when today is not validated yet (the streak is not lost until the day is over).
 */
export function computeStreak(
  sessions: readonly FinishedSession[],
  today: IsoDate,
  timeZone: string,
): StreakState {
  const byDay = minutesByDay(sessions, timeZone);
  const validated = new Set(
    [...byDay].filter(([, minutes]) => minutes >= XP_RULES.streakDayMinutes).map(([day]) => day),
  );
  const todayMinutes = Math.floor(byDay.get(today) ?? 0);
  const todayValidated = validated.has(today);

  let currentDays = 0;
  let cursor = todayValidated ? today : addDays(today, -1);
  while (validated.has(cursor)) {
    currentDays++;
    cursor = addDays(cursor, -1);
  }

  const days = [...validated].filter((d) => d <= today).sort();
  let recordDays = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && addDays(days[i - 1]!, 1) === days[i] ? run + 1 : 1;
    recordDays = Math.max(recordDays, run);
  }

  return {
    currentDays,
    recordDays,
    todayValidated,
    todayMinutes,
    lastValidatedOn: days.at(-1) ?? null,
  };
}
