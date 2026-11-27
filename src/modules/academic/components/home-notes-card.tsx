import { BarChart3 } from "lucide-react";
import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";
import type { Dashboard } from "../domain/dashboard";
import { formatAverage } from "../domain/format";

/** Home: the overall average and the first subject to work on. Links to Notes. */
export function HomeNotesCard({
  dashboard,
  subjectNames,
}: {
  dashboard: Dashboard;
  subjectNames: Map<string, string>;
}) {
  const first = dashboard.priorities.find((p) => p.needsAttention);
  return (
    <LinkCard href="/notes" label="Voir mes notes" className="h-full">
      <OrganicCard className="h-full justify-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"
        >
          <BarChart3 className="size-7" />
        </span>
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Mes notes</h2>
        <p className="font-heading text-4xl font-extrabold tabular-nums">
          {dashboard.overall === null ? "—" : formatAverage(dashboard.overall)}
        </p>
        <p className="text-sm text-muted-foreground">
          {dashboard.activeSubjects.length === 0
            ? "Ajoute ta première matière."
            : first
              ? `À réviser : ${subjectNames.get(first.id) ?? first.name}`
              : "Moyenne générale, sur 20."}
        </p>
      </OrganicCard>
    </LinkCard>
  );
}
