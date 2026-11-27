import { daysBetween, formatLongDate } from "../domain/dates";
import { countdownLabel } from "../domain/timetable";
import type { ExamItem } from "../domain/types";

const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

/** "À venir" under the month: the next tests with a countdown. Only real exams. */
export function UpcomingExams({ exams, today }: { exams: ExamItem[]; today: string }) {
  return (
    <section aria-labelledby="a-venir" className="space-y-3">
      <h2 id="a-venir" className="text-lg font-extrabold">
        À venir
      </h2>
      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun contrôle à venir.</p>
      ) : (
        <ul className="space-y-2">
          {exams.map((e) => {
            const gap = daysBetween(today, e.examOn);
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-3xl border bg-card p-3 text-left">
                <span
                  aria-hidden
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-revio-primary text-white"
                >
                  <span className="text-center text-base leading-none font-extrabold">
                    {Number(e.examOn.slice(8))}
                    <span className="block text-[10px] font-semibold">
                      {month.format(new Date(`${e.examOn}T00:00:00Z`))}
                    </span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{e.title}</span>
                  <span className="block text-sm text-muted-foreground first-letter:uppercase">
                    {formatLongDate(e.examOn)}
                  </span>
                </span>
                <span className="shrink-0 rounded-pill bg-brand-soft px-3 py-1 text-xs font-bold text-brand-soft-foreground">
                  {countdownLabel(gap)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
