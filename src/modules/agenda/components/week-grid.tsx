import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, eachDay, formatLongDate, formatMonth, formatWeekdayShort } from "../domain/dates";
import { findConflicts } from "../domain/occurrences";
import {
  durationMinutes,
  formatDuration,
  hourBounds,
  layoutBlocks,
  summarize,
  toTime,
} from "../domain/timetable";
import { KIND_LABELS, type AgendaItem } from "../domain/types";
import { cardClass, tintOf } from "./kind-style";

const HOUR_PX = 56;
/** " novembre 2026": read after the visible "lun. 23", so the link name starts with what is shown. */
const monthYear = (d: string) => ` ${formatMonth(d)}`;
const COLUMNS = "grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]";

type Props = {
  from: string;
  today: string;
  nowMinutes: number;
  byDay: Map<string, AgendaItem[]>;
  subjects: { id: string; name: string }[];
};

/**
 * The week as a time grid (Revio's "emploi du temps"): one column per day, one card per timed item placed by its
 * time, a line for the current time, and the all-day items (exams) above. Each card leads to the day, where an
 * event is edited or deleted. On a narrow screen the grid scrolls sideways.
 */
export function WeekGrid({ from, today, nowMinutes, byDay, subjects }: Props) {
  const days = eachDay(from, addDays(from, 6));
  const { first, last } = hourBounds(days.map((d) => byDay.get(d) ?? []));
  const height = (last - first) * HOUR_PX;
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const hasAllDay = days.some((d) => (byDay.get(d) ?? []).some((i) => i.startTime === null));
  const summary = summarize(byDay, from, addDays(from, 6));
  const nowTop = ((nowMinutes - first * 60) / 60) * HOUR_PX;
  const dayHref = (d: string) => `?vue=jour&date=${d}`;

  return (
    <section aria-label="Semaine" className="space-y-3">
      <div
        role="region"
        aria-label="Grille de la semaine, à faire défiler sur le côté si besoin"
        tabIndex={0}
        className="relative overflow-x-auto rounded-3xl border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="min-w-[46rem] p-3 text-left">
          <div className={COLUMNS}>
            <span />
            {days.map((d) => {
              const isToday = d === today;
              return (
                <Link
                  key={d}
                  href={dayHref(d)}
                  aria-current={isToday ? "date" : undefined}
                  className="flex flex-col items-center gap-1 rounded-2xl py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {isToday ? "Aujourd'hui" : formatWeekdayShort(d)}
                  </span>
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-lg font-bold tabular-nums",
                      isToday ? "bg-revio-deep text-white" : "bg-brand-soft text-brand-soft-foreground",
                    )}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <span className="sr-only">{monthYear(d)}</span>
                </Link>
              );
            })}
          </div>

          {hasAllDay && (
            <div className={cn(COLUMNS, "mt-1")}>
              <span className="pt-1 text-right text-[11px] text-muted-foreground">Journée</span>
              {days.map((d) => (
                <ul
                  key={d}
                  aria-label={`Toute la journée, ${formatLongDate(d)}`}
                  className="space-y-1 px-0.5"
                >
                  {(byDay.get(d) ?? [])
                    .filter((i) => i.startTime === null)
                    .map((i) => (
                      <li key={i.key}>
                        <Link
                          href={dayHref(d)}
                          className={cn(
                            "block truncate rounded-xl px-2 py-1 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            cardClass(i.kind),
                          )}
                        >
                          <span className="sr-only">{KIND_LABELS[i.kind]} : </span>
                          {i.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              ))}
            </div>
          )}

          <div className={cn(COLUMNS, "mt-2")}>
            <div aria-hidden className="relative" style={{ height }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums"
                  style={{ top: (h - first) * HOUR_PX }}
                >
                  {toTime(h * 60)}
                </span>
              ))}
            </div>
            {days.map((d) => {
              const items = byDay.get(d) ?? [];
              const conflicts = findConflicts(items);
              const isToday = d === today;
              return (
                <ol
                  key={d}
                  aria-label={formatLongDate(d)}
                  className={cn("relative rounded-xl", isToday && "bg-brand-soft/50")}
                  style={{
                    height,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, var(--border) ${HOUR_PX - 1}px, var(--border) ${HOUR_PX}px)`,
                  }}
                >
                  {layoutBlocks(items).map(({ item, start, lane, lanes }) => {
                    const blockHeight = Math.max((durationMinutes(item) / 60) * HOUR_PX - 3, 24);
                    const tall = blockHeight >= 44;
                    const clash = conflicts.has(item.key);
                    const subject = item.subjectId ? subjectName.get(item.subjectId) : undefined;
                    return (
                      <li
                        key={item.key}
                        className="absolute"
                        style={{
                          top: ((start - first * 60) / 60) * HOUR_PX + 1,
                          height: blockHeight,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                      >
                        <Link
                          href={dayHref(d)}
                          className={cn(
                            "flex h-full flex-col gap-0.5 overflow-hidden rounded-2xl px-2 py-1 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            cardClass(item.kind, tintOf(item.subjectId, subjects)),
                            clash && "ring-2 ring-destructive",
                          )}
                        >
                          {tall && (
                            <span className="tabular-nums">
                              {item.startTime}–{item.endTime}
                            </span>
                          )}
                          <span className="flex items-start gap-1 font-bold">
                            <span className={cn("min-w-0", tall ? "break-words" : "truncate")}>
                              {item.title}
                            </span>
                            {clash && <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />}
                          </span>
                          {tall && subject && subject !== item.title && (
                            <span className="truncate">{subject}</span>
                          )}
                          <span className="sr-only">
                            {KIND_LABELS[item.kind]}, {item.startTime}–{item.endTime}
                            {clash ? ", chevauche un autre créneau" : ""}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  {isToday && nowMinutes >= first * 60 && nowMinutes <= last * 60 && (
                    <li
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0"
                      style={{ top: nowTop }}
                    >
                      <span className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-revio-social-text" />
                      <span className="absolute -top-2.5 right-0 rounded-pill bg-revio-social-text px-1.5 py-0.5 text-[10px] font-bold text-background tabular-nums">
                        {toTime(nowMinutes)}
                      </span>
                    </li>
                  )}
                </ol>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {formatDuration(summary.classMinutes)} de cours · {formatDuration(summary.studyMinutes)} de révision ·{" "}
        {summary.exams} contrôle{summary.exams > 1 ? "s" : ""}. Tout vient de ton agenda.
      </p>
    </section>
  );
}
