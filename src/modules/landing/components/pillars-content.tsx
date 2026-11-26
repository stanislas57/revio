import { CalendarDays, Flame, GraduationCap, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** The content of the four pillars, shared by every layout of the section (same texts and statuses). */

export type PillarStatus = "building" | "soon";
export type PillarId = "notes" | "organiser" | "amis" | "motivation";

export const PILLAR_STATUS_LABEL: Record<PillarStatus, string> = {
  building: "En construction",
  soon: "Bientôt",
};

export type Pillar = {
  id: PillarId;
  icon: LucideIcon;
  title: string;
  text: string;
  points: string[];
  status: PillarStatus;
};

export const PILLARS: readonly Pillar[] = [
  {
    id: "notes",
    icon: GraduationCap,
    title: "Comprendre ses notes",
    text: "Saisis tes matières, tes coefficients et tes notes. Vois où tu en es et ce qu'il te faut au prochain examen.",
    points: ["Moyennes pondérées", "Simulation de notes", "Matières à travailler en priorité"],
    status: "building",
  },
  {
    id: "organiser",
    icon: CalendarDays,
    title: "S'organiser",
    text: "Un agenda pour tes examens et un planning de révision qui s'adapte à ton emploi du temps.",
    points: ["Agenda et examens", "Planning de révision", "Replanification quand tu rates une séance"],
    status: "soon",
  },
  {
    id: "amis",
    icon: Users,
    title: "Réviser avec ses amis",
    text: "Chaque séance terminée peut apparaître dans le fil de tes amis. Tu vois qui révise et tu peux l'encourager.",
    points: ["Amis et fil d'activité", "Amis en révision", "Bravo et encouragements"],
    status: "building",
  },
  {
    id: "motivation",
    icon: Flame,
    title: "Rester motivé",
    text: "Gagne des XP à chaque séance, garde ta série et monte de niveau. La régularité compte plus que la durée.",
    points: ["XP, niveaux et série", "Trophées et classements", "Défis et ligues"],
    status: "building",
  },
];

export const pillar = (id: PillarId): Pillar => PILLARS.find((p) => p.id === id)!;

/** "En construction" or "Bientôt", always written (never a colour alone). */
export function PillarStatusBadge({ status }: { status: PillarStatus }) {
  return <Badge variant={status === "soon" ? "outline" : "secondary"}>{PILLAR_STATUS_LABEL[status]}</Badge>;
}

/** Title and introduction of the section, identical in every layout. */
export function PillarsHeading({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <h2 id={id} className="landing-display text-4xl sm:text-5xl">
        Quatre idées, <em className="text-brand-text">une seule application</em>
      </h2>
      <p className="text-muted-foreground">
        Revio réunit le suivi des notes, l&apos;organisation, le réseau social et le jeu. Certaines fonctions
        sont en cours de construction, d&apos;autres arriveront plus tard.
      </p>
    </div>
  );
}

/** The averages note required by CLAUDE.md wherever an average is shown. */
export function AveragesNote() {
  return (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      Les moyennes sont calculées selon une convention Revio : ce ne sont pas les règles officielles de ton
      établissement.
    </p>
  );
}
