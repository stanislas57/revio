import Link from "next/link";
import { ChevronRight, Clock, GitBranch, SlidersHorizontal } from "lucide-react";
import { OrganicCard } from "@/components/revio/organic-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Dashboard } from "../domain/dashboard";
import { formatShortDate } from "../domain/dates";
import { formatAverage } from "../domain/format";

function countdown(days: number): string {
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

/**
 * The top of « Mes notes »: the overall average (Deep Violet), the next exam (exam gradient) and the way to the
 * simulator, the scenarios and the time split. Only what the grades and exams hold: no invented trend.
 */
export function NotesHero({ dashboard, scenarioCount }: { dashboard: Dashboard; scenarioCount: number }) {
  const { overall, target, gap, gradeCount, upcomingExams } = dashboard;
  const next = upcomingExams[0];
  const hasSubjects = dashboard.activeSubjects.length > 0;

  const links = [
    {
      href: "/notes/simulateur",
      Icon: SlidersHorizontal,
      title: "Simulateur",
      hint: "Et si j'avais… ?",
      deep: false,
    },
    {
      href: "/notes/simulateur#scenarios",
      Icon: GitBranch,
      title: "Scénarios",
      hint:
        scenarioCount === 0
          ? "Aucun enregistré"
          : `${scenarioCount} enregistré${scenarioCount > 1 ? "s" : ""}`,
      deep: false,
    },
    {
      href: "/notes/temps",
      Icon: Clock,
      title: "Répartir mon temps",
      hint: "Heures de révision",
      deep: true,
    },
  ];

  return (
    <section aria-label="Résumé de tes notes" className="grid gap-4 lg:grid-cols-3">
      <OrganicCard tone="deep" halo className="gap-1" role="group" aria-label="Moyenne générale">
        <p className="text-xs font-semibold tracking-wide uppercase">Moyenne générale</p>
        <p className="font-heading text-5xl font-extrabold tabular-nums">
          {overall === null ? "—" : formatAverage(overall)}
          <span className="ml-1 text-xl font-semibold">/20</span>
        </p>
        <p className="text-sm">
          {gradeCount === 0
            ? "Ajoute une première note."
            : `${gradeCount} note${gradeCount > 1 ? "s" : ""} prises en compte`}
        </p>
        <p className="text-sm">
          {target === null
            ? "Définis un objectif pour voir l'écart."
            : gap === null
              ? `Objectif ${formatAverage(target)}`
              : gap >= 0
                ? `Objectif atteint, ${formatAverage(gap)} point${gap >= 2 ? "s" : ""} d'avance.`
                : `Objectif ${formatAverage(target)} : il manque ${formatAverage(-gap)} point${-gap >= 2 ? "s" : ""}.`}
        </p>
        <Link
          href="#target"
          className="mt-1 min-h-11 content-center rounded-md text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-white/70"
        >
          Modifier mon objectif
        </Link>
      </OrganicCard>

      {next ? (
        <OrganicCard tone="exam" className="gap-1" role="group" aria-label="Prochain examen">
          <p className="text-xs font-semibold tracking-wide uppercase">Prochain examen</p>
          <p className="font-heading text-4xl font-extrabold">{countdown(next.inDays)}</p>
          <p className="text-lg font-bold">{next.title}</p>
          <p className="text-sm">
            {formatShortDate(next.examOn)}
            {next.subjectName ? ` · ${next.subjectName}` : ""}
          </p>
        </OrganicCard>
      ) : (
        <OrganicCard className="gap-1" role="group" aria-label="Prochain examen">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Prochain examen
          </p>
          <p className="text-xl font-extrabold">Aucun à venir</p>
          <p className="text-sm text-muted-foreground">Ajoute-en un dans « Examens à venir », plus bas.</p>
        </OrganicCard>
      )}

      <Card className="gap-3 p-3" role="group" aria-label="Aller plus loin">
        <ul className="space-y-2">
          {links.map(({ href, Icon, title, hint, deep }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-2xl px-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  deep ? "bg-revio-deep text-white" : "bg-brand-soft text-foreground hover:bg-brand-soft/70",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{title}</span>
                  <span className="block text-xs">{hint}</span>
                </span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        {!hasSubjects && (
          <p className="px-2 text-center text-xs text-muted-foreground">
            Le simulateur et la répartition du temps demandent au moins une matière.
          </p>
        )}
      </Card>
    </section>
  );
}
