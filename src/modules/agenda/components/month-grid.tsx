import Link from "next/link";
import { eachDay, formatLongDate, formatWeekdayShort, weekdayIndex } from "../domain/dates";
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
  exam: "bg-destructive",
};

/** Month overview: one cell per day with coloured dots; a day links to its day view. */
export function MonthGrid({ from, to, month, today, byDay }: Props) {
  const days = eachDay(from, to);
  return (
    <div role="group" aria-label="Mois" className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium">
        {days.slice(0, 7).map((d) => (
          <div key={d} className="p-1.5 capitalize">
            {formatWeekdayShort(d)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const items = byDay.get(d) ?? [];
          const inMonth = d.startsWith(month);
          return (
            <Link
              key={d}
              href={`?vue=jour&date=${d}`}
              aria-label={`${formatLongDate(d)}, ${items.length} élément${items.length > 1 ? "s" : ""}`}
              className={`flex min-h-14 flex-col gap-1 border-r border-b p-1.5 text-xs hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring sm:min-h-20 ${
                inMonth ? "" : "text-muted-foreground opacity-60"
              } ${weekdayIndex(d) === 6 ? "border-r-0" : ""}`}
            >
              <span
                className={`w-fit rounded-full px-1.5 tabular-nums ${
                  d === today ? "bg-primary font-semibold text-primary-foreground" : ""
                }`}
              >
                {Number(d.slice(8))}
              </span>
              <span className="flex flex-wrap gap-0.5">
                {items.slice(0, 6).map((i) => (
                  <span key={i.key} className={`size-1.5 rounded-full ${DOT[i.kind]}`} aria-hidden />
                ))}
              </span>
              {items.length > 0 && <span className="hidden truncate sm:block">{items[0]?.title}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
