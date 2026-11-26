import { Timer } from "lucide-react";
import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";
import { formatMinutes } from "../domain/format";

/** Home: finished Focus sessions and total time studied. Links to the statistics. */
export function HomeSessionsCard({ sessions, totalMinutes }: { sessions: number; totalMinutes: number }) {
  return (
    <LinkCard href="/profil/statistiques" label="Voir mes statistiques" className="h-full">
      <OrganicCard className="h-full justify-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"
        >
          <Timer className="size-7" />
        </span>
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Séances</h2>
        <p className="font-heading text-4xl font-extrabold tabular-nums">{sessions}</p>
        <p className="text-sm text-muted-foreground">
          {sessions === 0
            ? "Lance ta première séance Focus."
            : `${formatMinutes(totalMinutes)} de révision au total.`}
        </p>
      </OrganicCard>
    </LinkCard>
  );
}
