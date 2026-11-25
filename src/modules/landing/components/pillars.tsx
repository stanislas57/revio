"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, Flame, GraduationCap, Users, type LucideIcon } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FriendsMockup, GradesMockup, MotivationMockup, PlanningMockup } from "./pillar-mockups";
import { Reveal } from "./reveal";

type Status = "building" | "soon";

const PILLARS: {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  points: string[];
  status: Status;
  Mockup: () => React.ReactNode;
}[] = [
  {
    id: "notes",
    icon: GraduationCap,
    title: "Comprendre ses notes",
    text: "Saisis tes matières, tes coefficients et tes notes. Vois où tu en es et ce qu'il te faut au prochain examen.",
    points: ["Moyennes pondérées", "Simulation de notes", "Matières à travailler en priorité"],
    status: "building",
    Mockup: GradesMockup,
  },
  {
    id: "organiser",
    icon: CalendarDays,
    title: "S'organiser",
    text: "Un agenda pour tes examens et un planning de révision qui s'adapte à ton emploi du temps.",
    points: ["Agenda et examens", "Planning de révision", "Replanification quand tu rates une séance"],
    status: "soon",
    Mockup: PlanningMockup,
  },
  {
    id: "amis",
    icon: Users,
    title: "Réviser avec ses amis",
    text: "Chaque séance terminée peut apparaître dans le fil de tes amis. Tu vois qui révise et tu peux l'encourager.",
    points: ["Amis et fil d'activité", "Amis en révision", "Bravo et encouragements"],
    status: "building",
    Mockup: FriendsMockup,
  },
  {
    id: "motivation",
    icon: Flame,
    title: "Rester motivé",
    text: "Gagne des XP à chaque séance, garde ta série et monte de niveau. La régularité compte plus que la durée.",
    points: ["XP, niveaux et série", "Trophées et classements", "Défis et ligues"],
    status: "building",
    Mockup: MotivationMockup,
  },
];

const STATUS_LABEL: Record<Status, string> = { building: "En construction", soon: "Bientôt" };

/**
 * The four ideas as vertical tabs (arrow keys, Home and End move between them), each with a small animated
 * mock-up. The panel is keyed so the animation plays again when the tab changes.
 */
export function Pillars() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = PILLARS.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (index + 1) % PILLARS.length
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (index - 1 + PILLARS.length) % PILLARS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  const current = PILLARS[active]!;
  return (
    <section id="piliers" aria-labelledby="piliers-title" className="scroll-mt-16 border-t py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="piliers-title" className="landing-display text-4xl sm:text-5xl">
            Quatre idées, <em className="text-brand-text">une seule application</em>
          </h2>
          <p className="text-muted-foreground">
            Revio réunit le suivi des notes, l&apos;organisation, le réseau social et le jeu. Certaines
            fonctions sont en cours de construction, d&apos;autres arriveront plus tard.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-[18rem_1fr]">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Les quatre idées de Revio"
            className="flex flex-col gap-2"
          >
            {PILLARS.map(({ id, icon: Icon, title, status }, i) => (
              <button
                key={id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={i === active}
                aria-controls={`panel-${id}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors outline-none motion-reduce:transition-none",
                  "hover:border-brand/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  i === active && "border-brand bg-brand-soft text-brand-soft-foreground",
                )}
              >
                <Icon className="size-5 shrink-0 text-brand-text" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block text-xs opacity-80">{STATUS_LABEL[status]}</span>
                </span>
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${current.id}`}
            aria-labelledby={`tab-${current.id}`}
            tabIndex={0}
            className="rounded-2xl border bg-card p-6 shadow-[0_18px_50px_-30px_rgb(20_20_20/0.3)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="landing-display text-3xl">{current.title}</h3>
              <Badge variant={current.status === "soon" ? "outline" : "secondary"}>
                {STATUS_LABEL[current.status]}
              </Badge>
            </div>
            <p className="mt-3 text-muted-foreground">{current.text}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {current.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {p}
                </li>
              ))}
            </ul>
            <div key={current.id} className="mt-6 space-y-2 rounded-xl border bg-background p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <MockBadge /> Exemple animé, données inventées
              </p>
              <current.Mockup />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Les moyennes sont calculées selon une convention Revio : ce ne sont pas les règles officielles de
          ton établissement.
        </p>
      </Reveal>
    </section>
  );
}
