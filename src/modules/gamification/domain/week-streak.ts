/**
 * The seven days of the current week (Monday first) for the streak card. Pure display logic: a day is "done" when
 * its finished sessions reach the streak threshold (D-15); today stays dashed until then; there is no joker in the
 * product, so no day is ever shown as saved by one.
 */
import type { IsoDate } from "@/lib/contracts";

export type WeekDayState = "done" | "today" | "empty";
export type WeekDay = { label: string; name: string; state: WeekDayState };

const LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;
const DAY_MS = 86_400_000;

export function weekStreakDays(
  today: IsoDate,
  minutesByDate: Readonly<Record<string, number>>,
  dayMinutes: number,
): WeekDay[] {
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const mondayIndex = (new Date(todayMs).getUTCDay() + 6) % 7;
  const mondayMs = todayMs - mondayIndex * DAY_MS;
  return LABELS.map((label, i) => {
    const date = new Date(mondayMs + i * DAY_MS).toISOString().slice(0, 10);
    const done = (minutesByDate[date] ?? 0) >= dayMinutes;
    const state: WeekDayState = done ? "done" : date === today ? "today" : "empty";
    return { label, name: NAMES[i]!, state };
  });
}
