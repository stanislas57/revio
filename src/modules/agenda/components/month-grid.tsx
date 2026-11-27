import Link from "next/link";
import { cn } from "@/lib/utils";
import { eachDay, formatMonth, formatWeekdayShort, weekdayIndex } from "../domain/dates";
import type { AgendaItem } from "../domain/types";

type Props = {
  from: string;
  to: string;
  /** Month shown (YYYY-MM), to dim the days of adjacent months. */
  month: string;
  today: string;
  byDay: Map<string, AgendaItem[]>;
};

const DOT: Record<AgendaItem["kind"], string> = {
  study: "bg-primary",
  class: "bg-sky-500",
  unavailable: "bg-muted-foreground",
  other: "bg-amber-500",
  exam: "bg-revio-primary",
};

/**
 * Month overview: one cell per day with its number, coloured dots, a dark circle for today and a violet one for a
 * day with a test; a day links to its day view.
 */
export function MonthGrid({ from, to, month, today, byDay }: Props) {
  const days = eachDay(from, to);
  return (
    <div role="group" aria-label="Mois" className="rounded-3xl border bg-card p-2 sm:p-3">
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground uppercase">
        {days.slice(0, 7).map((d) => (
          <div key={d} className="p-1.5">
            {formatWeekdayShort(d).slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => {
          const items = byDay.get(d) ?? [];
          const inMonth = d.startsWith(month);
          const exam = items.some((i) => i.kind === "exam");
          const isToday = d === today;
          return (
            <Link
              key={d}
              href={`?vue=jour&date=${d}`}
              className={cn(
                "flex min-h-14 flex-col items-center gap-1 rounded-2xl p-1 text-xs outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-h-16",
                !inMonth && "text-muted-foreground",
                weekdayIndex(d) >= 5 && inMonth && "font-medium",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm font-bold tabular-nums",
                  isToday ? "bg-foreground text-background" : exam && "bg-revio-primary text-white",
                )}
              >
                {Number(d.slice(8))}
              </span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {items.slice(0, 6).map((i) => (
                  <span key={i.key} className={`size-2 rounded-full ${DOT[i.kind]}`} aria-hidden />
                ))}
              </span>
              <span className="sr-only">
                {` ${formatMonth(d)}${isToday ? ", aujourd'hui" : ""}, ${items.length} élément${items.length > 1 ? "s" : ""}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
