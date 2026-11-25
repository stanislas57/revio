/**
 * Leaderboard display logic (pure). Positions and scores are computed by the server; this only
 * arranges what it returns (podium, my position) and computes the time left in the period.
 * A leaderboard entry carries XP only: never a grade, an average or a subject.
 */

import type { IsoDate } from "@/lib/contracts";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { localDate } from "@/modules/gamification/domain/streak";

export type PeriodId = "day" | "week" | "month" | "all";

export const PERIODS: readonly { id: PeriodId; label: string }[] = [
  { id: "day", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois-ci" },
  { id: "all", label: "Depuis le début" },
];

const DAY_MS = 86_400_000;

/** Offset of `timeZone` from UTC at `date`, in ms (positive east of Greenwich). */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant at which the local day `day` starts in `timeZone` (DST-safe). */
export function startOfLocalDay(day: IsoDate, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const naive = Date.UTC(y, m - 1, d);
  // Two passes: the offset can differ between the naive guess and the real instant around a DST change.
  let instant = naive - zoneOffsetMs(new Date(naive), timeZone);
  instant = naive - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

/**
 * End of the current week: the next Monday at 00:00 in the user's time zone. Weeks run from
 * Monday to Sunday. At Monday 00:00 sharp a new week has just started, so the end is 7 days away.
 */
export function weekEnd(now: Date | string, timeZone: string): Date {
  const date = typeof now === "string" ? new Date(now) : now;
  if (Number.isNaN(date.getTime())) throw new RangeError("Date invalide.");
  const today = localDate(date, timeZone);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const daysUntilMonday = (8 - weekday) % 7 || 7;
  const monday = new Date(Date.parse(`${today}T00:00:00Z`) + daysUntilMonday * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return startOfLocalDay(monday, timeZone);
}

export type TimeLeft = { days: number; hours: number; minutes: number; totalMs: number };

export function timeLeft(now: Date | string, end: Date): TimeLeft {
  const ref = typeof now === "string" ? Date.parse(now) : now.getTime();
  const totalMs = Math.max(0, end.getTime() - ref);
  const totalMinutes = Math.floor(totalMs / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    totalMs,
  };
}

/** "lundi 30 novembre à 00:00", written in the user's time zone (not the browser's). */
export function formatWeekEnd(end: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(end);
}

/** "4 j 6 h", "5 h 12 min", "12 min", "moins d'une minute", "terminé". */
export function formatTimeLeft(left: TimeLeft): string {
  if (left.totalMs <= 0) return "terminé";
  if (left.days > 0) return `${left.days} j ${left.hours} h`;
  if (left.hours > 0) return `${left.hours} h ${String(left.minutes).padStart(2, "0")} min`;
  if (left.minutes > 0) return `${left.minutes} min`;
  return "moins d'une minute";
}

/** Entries by rank (stable for equal ranks). */
export function byRank(entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => a.rank - b.rank);
}

/** The three first, in reading order (1, 2, 3). The podium puts the winner in the middle with CSS. */
export function topThree(entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return byRank(entries).slice(0, 3);
}

/** Everyone after the third place. */
export function afterPodium(entries: readonly LeaderboardEntry[]): LeaderboardEntry[] {
  return byRank(entries).slice(3);
}

export function myEntry(entries: readonly LeaderboardEntry[]): LeaderboardEntry | null {
  return entries.find((e) => e.isMe) ?? null;
}

/** XP missing to pass the person just above me, or null when I am first or not ranked. */
export function gapToNext(
  entries: readonly LeaderboardEntry[],
): { xp: number; entry: LeaderboardEntry } | null {
  const me = myEntry(entries);
  if (!me) return null;
  const above = byRank(entries)
    .filter((e) => e.rank < me.rank)
    .at(-1);
  if (!above) return null;
  return { xp: Math.max(0, above.weeklyXp - me.weeklyXp) + 1, entry: above };
}

/** "1er", "2e", "3e". */
export function rankLabel(rank: number): string {
  return rank === 1 ? "1er" : `${rank}e`;
}
