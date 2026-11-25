/**
 * Display helpers for the statistics screen (pure). The numbers (today, week, month, total,
 * sessions, average, per subject, per day) come from the server and are shown as they are:
 * nothing here computes an official statistic. The only derived things are display re-binnings
 * of the daily series the server provides (weeks, heatmap cells), clearly labelled as such.
 */

import type { IsoDate } from "@/lib/contracts";
import type { StudyStats } from "../contracts";

export type DailyPoint = StudyStats["daily"][number];

const DAY_MS = 86_400_000;

function utcDay(day: IsoDate): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** 0 = Monday ... 6 = Sunday, for a calendar day "YYYY-MM-DD". */
export function weekdayIndex(day: IsoDate): number {
  return (new Date(utcDay(day)).getUTCDay() + 6) % 7;
}

/** The Monday of the week containing `day`. */
export function mondayOf(day: IsoDate): IsoDate {
  return new Date(utcDay(day) - weekdayIndex(day) * DAY_MS).toISOString().slice(0, 10);
}

export type WeekBin = {
  weekStart: IsoDate;
  minutes: number;
  xp: number;
  /** How many days of this week are in the series (7 for a full week). */
  days: number;
  /** True when the series does not cover the whole Monday to Sunday week (first and last bins). */
  partial: boolean;
};

/**
 * Regroups the daily series by Monday-to-Sunday week, for display only. A week the series only
 * partly covers is marked `partial`, so the chart never presents it as a full week.
 */
export function weekBins(daily: readonly DailyPoint[]): WeekBin[] {
  const bins = new Map<IsoDate, WeekBin>();
  for (const d of [...daily].sort((a, b) => a.date.localeCompare(b.date))) {
    const weekStart = mondayOf(d.date);
    const bin = bins.get(weekStart) ?? { weekStart, minutes: 0, xp: 0, days: 0, partial: false };
    bin.minutes += d.minutes;
    bin.xp += d.xp;
    bin.days += 1;
    bins.set(weekStart, bin);
  }
  return [...bins.values()].map((b) => ({ ...b, partial: b.days < 7 }));
}

/** 0 none · 1 under a quarter hour · 2 under half an hour · 3 under an hour · 4 an hour or more. */
export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

/** Display scale of the heatmap (30 minutes is the default daily goal). Not a statistic. */
export const INTENSITY_THRESHOLDS = [1, 15, 30, 60] as const;

export function intensityLevel(minutes: number): IntensityLevel {
  if (!Number.isFinite(minutes) || minutes < INTENSITY_THRESHOLDS[0]) return 0;
  if (minutes < INTENSITY_THRESHOLDS[1]) return 1;
  if (minutes < INTENSITY_THRESHOLDS[2]) return 2;
  if (minutes < INTENSITY_THRESHOLDS[3]) return 3;
  return 4;
}

export type HeatmapCell = { date: IsoDate | null; minutes: number; level: IntensityLevel };

/**
 * Heatmap columns (one per week, Monday at the top). The first and last weeks are padded with
 * empty cells (`date: null`) so every column has seven rows.
 */
export function heatmapColumns(daily: readonly DailyPoint[]): HeatmapCell[][] {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];
  const byDate = new Map(sorted.map((d) => [d.date, d.minutes]));
  const first = mondayOf(sorted[0]!.date);
  const last = sorted.at(-1)!.date;
  const columns: HeatmapCell[][] = [];
  for (let start = utcDay(first); start <= utcDay(last); start += 7 * DAY_MS) {
    const column: HeatmapCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
      const known = byDate.has(date);
      const minutes = known ? byDate.get(date)! : 0;
      column.push({ date: known ? date : null, minutes, level: known ? intensityLevel(minutes) : 0 });
    }
    columns.push(column);
  }
  return columns;
}

/** True when there is nothing to chart yet (no session at all). */
export function isEmptyStats(stats: StudyStats): boolean {
  return stats.sessionsCount === 0 && stats.daily.every((d) => d.minutes === 0 && d.xp === 0);
}

/** "24 nov", from a calendar day. */
export function shortDay(day: IsoDate): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(utcDay(day)),
  );
}

/** "24 nov", for use inside a sentence (shortDay ends with the dot of the month abbreviation). */
export function plainDay(day: IsoDate): string {
  return shortDay(day).replace(/\.$/, "");
}

/** "mardi 24 novembre". */
export function longDay(day: IsoDate): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(utcDay(day)));
}
