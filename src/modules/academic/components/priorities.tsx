import { cn } from "@/lib/utils";
import type { Dashboard } from "../domain/dashboard";

/** The look of the n-th priority: Deep Violet for the first, a pink outline for the second, soft tints after. */
function rankClass(rank: number): string {
  if (rank === 0) return "bg-revio-deep text-white";
  if (rank === 1) return "border-2 border-revio-social-text bg-card text-foreground";
  return rank % 2 === 0 ? "bg-brand-soft text-foreground" : "border bg-card text-foreground";
}

/** « À réviser en priorité »: the subjects under the goal, with the reason (no AI: the score is explained). */
export function Priorities({
  dashboard,
  subjectNames,
}: {
  dashboard: Dashboard;
  subjectNames: Map<string, string>;
}) {
  const top = dashboard.priorities.filter((p) => p.needsAttention).slice(0, 4);
  return (
    <section aria-labelledby="priorites" className="space-y-3">
      <div className="space-y-1">
        <h2 id="priorites" className="text-xl font-extrabold">
          À réviser en priorité
        </h2>
        <p className="text-sm text-muted-foreground">
          Score = écart à l&apos;objectif × poids de la matière, renforcé si un examen approche. Pas d&apos;IA
          : tout est expliqué.
        </p>
      </div>
      {top.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-5 text-sm text-muted-foreground">
          {dashboard.activeSubjects.length === 0
            ? "Ajoute des matières pour voir tes priorités."
            : "Aucune matière sous l'objectif : bravo."}
        </p>
      ) : (
        <ol className="space-y-2">
          {top.map((p, i) => (
            <li key={p.id}>
              <a
                href={`#matiere-${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-3xl p-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  rankClass(i),
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                    i === 0 ? "bg-white text-revio-deep" : "bg-brand-soft text-brand-soft-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">
                    <span className="sr-only">Priorité {i + 1} : </span>
                    {subjectNames.get(p.id) ?? p.name}
                  </span>
                  <span className="block text-sm">{p.reason}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** The averages are Revio's convention, never a school's official rule. */
export function ConventionNote() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      Moyennes calculées selon la convention Revio (moyenne pondérée sur 20). Ce n&apos;est pas la règle
      officielle de ton établissement. Tes notes restent privées.
    </p>
  );
}
