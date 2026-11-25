import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDayMonth, formatLongDate, formatMonth } from "../domain/dates";
import { shiftDate } from "../domain/range";
import { VIEWS, type View } from "../domain/types";

const VIEW_LABEL: Record<View, string> = { jour: "Jour", semaine: "Semaine", mois: "Mois" };

function title(view: View, date: string, from: string, to: string): string {
  if (view === "jour") return formatLongDate(date);
  if (view === "mois") return formatMonth(date);
  return `${formatDayMonth(from)} – ${formatDayMonth(to)}`;
}

export function AgendaToolbar({
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Navigation de l'agenda" className="flex items-center gap-1">
        <Button asChild variant="outline" size="icon" aria-label="Période précédente">
          <Link href={href(view, shiftDate(view, date, -1))}>
            <ChevronLeft />
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-9">
          <Link href={href(view, today)}>Aujourd&apos;hui</Link>
        </Button>
        <Button asChild variant="outline" size="icon" aria-label="Période suivante">
          <Link href={href(view, shiftDate(view, date, 1))}>
            <ChevronRight />
          </Link>
        </Button>
      </nav>
      <p
        aria-live="polite"
        className="order-last w-full text-base font-semibold capitalize sm:order-none sm:w-auto"
      >
        {title(view, date, from, to)}
      </p>
      <div role="group" aria-label="Affichage" className="flex rounded-md border p-0.5">
        {VIEWS.map((v) => (
          <Button
            key={v}
            asChild
            size="sm"
            variant={v === view ? "default" : "ghost"}
            aria-current={v === view ? "page" : undefined}
          >
            <Link href={href(v, date)}>{VIEW_LABEL[v]}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
