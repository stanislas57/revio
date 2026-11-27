import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { cn } from "@/lib/utils";
import { formatLongDate, formatMonth, formatWeekRange } from "../domain/dates";
import { shiftDate } from "../domain/range";
import { VIEWS, type View } from "../domain/types";

const VIEW_LABEL: Record<View, string> = { jour: "Jour", semaine: "Semaine", mois: "Mois" };

function period(view: View, date: string, from: string, to: string): string {
  if (view === "jour") return formatLongDate(date);
  if (view === "mois") return formatMonth(date);
  return `Semaine du ${formatWeekRange(from, to)}`;
}

const circle =
  "grid size-11 place-items-center rounded-full border bg-card text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Header of the timetable: the period, the title with its hand-drawn underline, the Jour / Semaine / Mois switch,
 * previous / today / next, and the "Planifier une révision" button (it leads to the add form below).
 */
export function AgendaHeader({
  view,
  date,
  today,
  from,
  to,
}: {
  view: View;
  date: string;
  today: string;
  from: string;
  to: string;
}) {
  const href = (v: View, d: string) => `?vue=${v}&date=${d}`;
  return (
    <header className="flex flex-wrap items-end justify-center gap-x-6 gap-y-4 md:justify-between md:text-left">
      <div className="flex flex-col items-center gap-1 md:items-start">
        <p aria-live="polite" className="text-sm text-muted-foreground first-letter:uppercase">
          {period(view, date, from, to)}
        </p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight">Emploi du temps</h1>
        <svg width="180" height="14" viewBox="0 0 180 14" aria-hidden="true" className="text-revio-social">
          <path
            d="M2 8 C 20 1, 38 15, 58 8 S 96 1, 116 8 S 154 15, 178 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <div
          role="group"
          aria-label="Affichage"
          className="flex rounded-[26px_20px_24px_22px] bg-brand-soft p-1"
        >
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={href(v, date)}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                v === view
                  ? "[border-radius:22px_16px_20px_18px/18px_22px_16px_20px] bg-foreground text-background"
                  : "text-brand-soft-foreground hover:bg-card/60",
              )}
            >
              {VIEW_LABEL[v]}
            </Link>
          ))}
        </div>
        <nav aria-label="Navigation de l'agenda" className="flex items-center gap-2">
          <Link
            href={href(view, shiftDate(view, date, -1))}
            aria-label="Période précédente"
            className={circle}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <Link
            href={href(view, today)}
            className="flex min-h-11 items-center rounded-full border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Aujourd&apos;hui
          </Link>
          <Link href={href(view, shiftDate(view, date, 1))} aria-label="Période suivante" className={circle}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </nav>
        <ChunkyButton asChild size="lg" className="min-h-11">
          <Link href="#ajouter">
            <Plus aria-hidden /> Planifier une révision
          </Link>
        </ChunkyButton>
      </div>
    </header>
  );
}
