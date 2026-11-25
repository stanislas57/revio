import { CalendarDays, Flame, GraduationCap, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Status = "building" | "soon";

const PILLARS: {
  icon: LucideIcon;
  title: string;
  text: string;
  points: string[];
  status: Status;
  color: string;
}[] = [
  {
    icon: GraduationCap,
    title: "Comprendre ses notes",
    text: "Saisis tes matières, tes coefficients et tes notes. Vois où tu en es et ce qu'il te faut au prochain examen.",
    points: ["Moyennes pondérées", "Simulation de notes", "Matières à travailler en priorité"],
    status: "building",
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    icon: CalendarDays,
    title: "S'organiser",
    text: "Un agenda pour tes examens et un planning de révision qui s'adapte à ton emploi du temps.",
    points: ["Agenda et examens", "Planning de révision", "Replanification quand tu rates une séance"],
    status: "soon",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Users,
    title: "Réviser avec ses amis",
    text: "Chaque séance terminée peut apparaître dans le fil de tes amis. Tu vois qui révise et tu peux l'encourager.",
    points: ["Amis et fil d'activité", "Amis en révision", "Bravo et encouragements"],
    status: "building",
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    icon: Flame,
    title: "Rester motivé",
    text: "Gagne des XP à chaque séance, garde ta série et monte de niveau. La régularité compte plus que la durée.",
    points: ["XP, niveaux et série", "Trophées et classements", "Défis et ligues"],
    status: "building",
    color: "text-orange-600 dark:text-orange-400",
  },
];

const STATUS_LABEL: Record<Status, string> = { building: "En construction", soon: "Bientôt" };

export function Pillars() {
  return (
    <section
      id="piliers"
      aria-labelledby="piliers-title"
      className="scroll-mt-16 border-t bg-muted/30 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="piliers-title" className="text-3xl font-bold tracking-tight">
            Quatre idées, une seule application
          </h2>
          <p className="text-muted-foreground">
            Revio réunit le suivi des notes, l&apos;organisation, le réseau social et le jeu. Certaines
            fonctions sont en cours de construction, d&apos;autres arriveront plus tard.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, text, points, status, color }) => (
            <li key={title} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className={`size-5 ${color}`} aria-hidden />
                </span>
                <Badge variant={status === "soon" ? "outline" : "secondary"}>{STATUS_LABEL[status]}</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
              <ul className="mt-auto space-y-1.5 text-sm">
                {points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Les moyennes sont calculées selon une convention Revio : ce ne sont pas les règles officielles de
          ton établissement.
        </p>
      </div>
    </section>
  );
}
