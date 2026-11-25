import { addDays, addMonths, startOfMonth, startOfWeek } from "./dates";
import type { View } from "./types";

/** First and last day displayed for a view around `date`. Months show whole weeks. */
export function viewRange(view: View, date: string): { from: string; to: string } {
  switch (view) {
    case "jour":
      return { from: date, to: date };
    case "semaine": {
      const from = startOfWeek(date);
      return { from, to: addDays(from, 6) };
    }
    case "mois": {
      const first = startOfMonth(date);
      const from = startOfWeek(first);
      const lastOfMonth = addDays(addMonths(first, 1), -1);
      return { from, to: addDays(startOfWeek(lastOfMonth), 6) };
    }
  }
}

/** The date the previous / next button leads to. */
export function shiftDate(view: View, date: string, direction: -1 | 1): string {
  if (view === "jour") return addDays(date, direction);
  if (view === "semaine") return addDays(date, 7 * direction);
  return addMonths(startOfMonth(date), direction);
}
