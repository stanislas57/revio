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
        <Card>
          <CardHeader>
            <CardDescription>Moyenne générale</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {overall === null ? "—" : formatAverage(overall)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {gradeCount === 0
              ? "Ajoute une première note."
              : `${gradeCount} note${gradeCount > 1 ? "s" : ""} prises en compte`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Objectif</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {target === null ? "—" : formatAverage(target)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {gap === null
              ? "Définis un objectif pour voir l'écart."
              : gap >= 0
                ? `Atteint, avec ${formatAverage(gap)} point${gap >= 2 ? "s" : ""} d'avance.`
                : `Il manque ${formatAverage(-gap)} point${-gap >= 2 ? "s" : ""}.`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Par semestre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {semesters.length === 0 && <p className="text-muted-foreground">—</p>}
            {semesters.map((s) => (
              <p key={s.key ?? "none"} className="flex justify-between gap-2">
                <span className="truncate">{s.key ?? "Sans semestre"}</span>
                <span className="tabular-nums">{s.average === null ? "—" : formatAverage(s.average)}</span>
              </p>
            ))}
          </CardContent>
        </Card>
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
                  <p className="flex items-center gap-2 font-medium">
                    <Badge variant="secondary">{i + 1}</Badge>
                    {subjectNames.get(p.id) ?? p.name}
                  </p>
                  <p className="mt-1 text-muted-foreground">{p.reason}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Moyennes calculées selon la convention Revio (moyenne pondérée sur 20). Ce n&apos;est pas la règle
        officielle de ton établissement. Tes notes restent privées.
      </p>
    </div>
  );
}
