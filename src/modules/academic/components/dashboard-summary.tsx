import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dashboard } from "../domain/dashboard";
import { formatAverage } from "../domain/format";

export function DashboardSummary({
  dashboard,
  subjectNames,
}: {
  dashboard: Dashboard;
  subjectNames: Map<string, string>;
}) {
  const { overall, target, gap, gradeCount, semesters, priorities } = dashboard;
  const top = priorities.filter((p) => p.needsAttention).slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <LinkCard href="#matieres" label="Voir mes matières et mes notes" className="h-full">
          <OrganicCard className="h-full justify-center">
            <p className="text-sm text-muted-foreground">Moyenne générale</p>
            <p className="font-heading text-3xl font-extrabold tabular-nums">
              {overall === null ? "—" : formatAverage(overall)}
            </p>
            <p className="text-xs text-muted-foreground">
              {gradeCount === 0
                ? "Ajoute une première note."
                : `${gradeCount} note${gradeCount > 1 ? "s" : ""} prises en compte`}
            </p>
          </OrganicCard>
        </LinkCard>
        <LinkCard href="#target" label="Modifier mon objectif" className="h-full">
          <OrganicCard className="h-full justify-center">
            <p className="text-sm text-muted-foreground">Objectif</p>
            <p className="font-heading text-3xl font-extrabold tabular-nums">
              {target === null ? "—" : formatAverage(target)}
            </p>
            <p className="text-xs text-muted-foreground">
              {gap === null
                ? "Définis un objectif pour voir l'écart."
                : gap >= 0
                  ? `Atteint, avec ${formatAverage(gap)} point${gap >= 2 ? "s" : ""} d'avance.`
                  : `Il manque ${formatAverage(-gap)} point${-gap >= 2 ? "s" : ""}.`}
            </p>
          </OrganicCard>
        </LinkCard>
        <LinkCard href="#matieres" label="Voir mes matières par semestre" className="h-full">
          <OrganicCard className="h-full justify-center">
            <p className="text-sm text-muted-foreground">Par semestre</p>
            <div className="w-full space-y-1 text-sm">
              {semesters.length === 0 && <p className="text-muted-foreground">—</p>}
              {semesters.map((s) => (
                <p key={s.key ?? "none"} className="flex justify-center gap-2">
                  <span className="truncate">{s.key ?? "Sans semestre"}</span>
                  <span className="tabular-nums">{s.average === null ? "—" : formatAverage(s.average)}</span>
                </p>
              ))}
            </div>
          </OrganicCard>
        </LinkCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matières à travailler en priorité</CardTitle>
          <CardDescription>
            Score = écart à l&apos;objectif × poids de la matière, renforcé si un examen approche. Pas
            d&apos;IA : tout est expliqué.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dashboard.activeSubjects.length === 0
                ? "Ajoute des matières pour voir tes priorités."
                : "Aucune matière sous l'objectif : bravo."}
            </p>
          ) : (
            <ol className="space-y-3">
              {top.map((p, i) => (
                <li key={p.id} className="text-sm">
                  <a
                    href={`#matiere-${p.id}`}
                    className="block rounded-md outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <Badge variant="secondary">{i + 1}</Badge>
                      {subjectNames.get(p.id) ?? p.name}
                    </p>
                    <p className="mt-1 text-muted-foreground">{p.reason}</p>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Moyennes calculées selon la convention Revio (moyenne pondérée sur 20). Ce n&apos;est pas la règle
        officielle de ton établissement. Tes notes restent privées.
      </p>
    </div>
  );
}
