import { addDays, daysBetween } from "./dates";
import type { AgendaItem } from "./types";

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * The next `limit` agenda items from `today` on, in day order then in the order of the day view. Timed items of
 * today that are already over (end time before `nowTime`) are skipped; all-day items of today stay.
 */
export function upcomingItems(
  byDay: Map<string, AgendaItem[]>,
  today: string,
  nowTime: string,
  limit = 3,
): AgendaItem[] {
  const out: AgendaItem[] = [];
  const days = [...byDay.keys()].filter((d) => d >= today).sort();
  for (const day of days) {
    for (const item of byDay.get(day) ?? []) {
      if (day === today && item.endTime !== null && item.endTime <= nowTime) continue;
      out.push(item);
      if (out.length === limit) return out;
    }
  }
  return out;
}

/** "Aujourd'hui", "Demain", or "jeu. 3 déc." for a later day (dates are wall dates, formatted in UTC). */
export function relativeDayLabel(date: string, today: string): string {
  const gap = daysBetween(today, date);
  if (gap === 0) return "Aujourd'hui";
  if (gap === 1) return "Demain";
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}

/** The last day of the "upcoming" window that starts today (two weeks). */
export const upcomingWindowEnd = (today: string) => addDays(today, 13);
