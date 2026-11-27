import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, eachDay, formatMonth, formatWeekdayShort } from "../domain/dates";
import type { AgendaItem } from "../domain/types";

/** The seven days of the week around the chosen day (Monday first): a dot for a day with something planned, a cap for a day with a test. */
export function DayStrip({
  date,
  today,
  weekFrom,
  byDay,
}: {
  date: string;
  today: string;
  weekFrom: string;
  byDay: Map<string, AgendaItem[]>;
}) {
  return (
    <nav aria-label="Jours de la semaine">
      <ul className="grid grid-cols-7 gap-1.5">
        {eachDay(weekFrom, addDays(weekFrom, 6)).map((d) => {
          const items = byDay.get(d) ?? [];
          const selected = d === date;
          const exam = items.some((i) => i.kind === "exam");
          return (
            <li key={d}>
              <Link
                href={`?vue=jour&date=${d}`}
                aria-current={selected ? "date" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  selected
                    ? "bg-revio-deep text-white shadow-md"
                    : exam
                      ? "bg-revio-social/20 text-foreground"
                      : "bg-brand-soft text-foreground",
                )}
              >
                <span className="text-[11px] font-semibold uppercase">
                  {formatWeekdayShort(d).replace(".", "")}
                </span>
                <span className="text-lg font-bold tabular-nums">{Number(d.slice(8))}</span>
                <span aria-hidden className="flex h-3 items-center gap-0.5">
                  {exam ? (
                    <GraduationCap className="size-3" />
                  ) : items.length > 0 ? (
                    <span className="size-1.5 rounded-full bg-current" />
                  ) : null}
                  {d === today && !exam && <span className="size-1.5 rounded-full bg-revio-social" />}
                </span>
                <span className="sr-only">
                  {` ${formatMonth(d)}${d === today ? ", aujourd'hui" : ""}, ${items.length} élément${items.length > 1 ? "s" : ""}${exam ? ", dont un contrôle" : ""}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
