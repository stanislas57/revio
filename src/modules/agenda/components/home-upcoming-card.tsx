import { CalendarDays } from "lucide-react";
import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";
import type { AgendaItem } from "../domain/types";
import { relativeDayLabel } from "../domain/upcoming";

const KIND_LABEL: Record<AgendaItem["kind"], string> = {
  study: "Révision",
  class: "Cours",
  unavailable: "Indisponible",
  other: "Autre",
  exam: "Examen",
};

/** Home: the next three agenda items (events and exams) of the coming two weeks. Links to the agenda. */
export function HomeUpcomingCard({ items, today }: { items: AgendaItem[]; today: string }) {
  return (
    <LinkCard href="/agenda" label="Voir mon agenda" className="h-full">
      <OrganicCard className="h-full justify-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"
        >
          <CalendarDays className="size-7" />
        </span>
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Prochains événements
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rien de prévu dans les deux semaines.</p>
        ) : (
          <ul className="w-full space-y-2">
            {items.map((i) => (
              <li key={`${i.date}-${i.key}`} className="rounded-xl bg-muted px-3 py-2 text-sm">
                <span className="block font-semibold">{i.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {relativeDayLabel(i.date, today)}
                  {i.startTime ? ` · ${i.startTime.replace(":", " h ")}` : ""} · {KIND_LABEL[i.kind]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </OrganicCard>
    </LinkCard>
  );
}
