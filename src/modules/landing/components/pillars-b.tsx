"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, HandHeart } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { formatAverage } from "@/modules/academic/domain/format";
import { cn } from "@/lib/utils";
import { DEMO_FRIENDS_LIVE, DEMO_LEVEL } from "../demo-data";
import { DEMO_BASE_AVERAGE } from "./pillar-demos";
import { AveragesNote, PillarStatusBadge, PillarsHeading, pillar, type PillarId } from "./pillars-content";
import { Reveal } from "./reveal";
import { usePrefersReducedMotion } from "./use-in-view-once";

// ---- The four screens of the phone (decorative: the text of each step says the same thing) ------------------

function ScreenFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-[0.7rem] font-bold tracking-widest text-brand-text uppercase">{label}</p>
      {children}
    </div>
  );
}

const BARS = [
  { name: "Stats", grade: 15 },
  { name: "Droit", grade: 11, priority: true },
  { name: "Mkt", grade: 13.5 },
  { name: "Angl.", grade: 16 },
];

function NotesScreen() {
  return (
    <ScreenFrame label="Mes notes">
      <div className="rounded-lg bg-muted p-3">
        <p className="text-xs text-muted-foreground">Moyenne générale</p>
        <p className="font-heading text-3xl font-extrabold tabular-nums">
          {formatAverage(DEMO_BASE_AVERAGE)}
        </p>
      </div>
      <div className="flex h-28 items-end gap-2">
        {BARS.map((b) => (
          <div key={b.name} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div
              className={cn("w-full rounded-t-md", b.priority ? "bg-ring" : "bg-chart-2")}
              style={{ height: `${(b.grade / 20) * 100}%` }}
            />
            <span className="text-[0.65rem] text-muted-foreground">{b.name}</span>
          </div>
        ))}
      </div>
      <p className="rounded-md border px-2 py-1.5 text-xs">
        <span className="font-semibold">Droit</span> : à travailler en priorité
      </p>
    </ScreenFrame>
  );
}

function PlanScreen() {
  const slots = [
    { day: "Lun", text: "18 h · Statistiques", done: true },
    { day: "Mer", text: "17 h 30 · Droit", done: true },
    { day: "Ven", text: "14 h · Marketing", done: false },
  ];
  return (
    <ScreenFrame label="Ma semaine">
      <ul className="space-y-2">
        {slots.map((s) => (
          <li
            key={s.day}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
              s.done && "border-brand bg-brand-soft text-brand-soft-foreground",
            )}
          >
            <span className="w-7 font-semibold">{s.day}</span>
            <span className="flex-1">{s.text}</span>
            {s.done && <Check className="size-3.5" />}
          </li>
        ))}
      </ul>
      <p className="rounded-md border border-dashed px-2 py-1.5 text-xs">
        Séance manquée ? Elle est replacée jeudi.
      </p>
    </ScreenFrame>
  );
}

function FocusScreen() {
  const percent = Math.floor(DEMO_LEVEL.progress * 100);
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <ScreenFrame label="Focus">
      <div className="relative mx-auto size-32">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--revio-primary-light)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--ring)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${c * 0.62} ${c}`}
          />
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-extrabold tabular-nums">15:30</span>
          <span className="text-[0.65rem] text-muted-foreground">Statistiques</span>
        </p>
      </div>
      <p className="mx-auto rounded-pill bg-revio-lime px-3 py-1 text-xs font-bold text-revio-midnight">
        +25 XP à la fin de la séance
      </p>
      <div className="space-y-1">
        <p className="flex justify-between text-[0.7rem]">
          <span className="font-semibold">{DEMO_LEVEL.current.name}</span>
          <span className="text-muted-foreground">{DEMO_LEVEL.next?.name}</span>
        </p>
        <div className="h-2 overflow-hidden rounded-pill bg-revio-primary-light">
          <div className="h-full rounded-pill bg-ring" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </ScreenFrame>
  );
}

function FriendsScreen() {
  const [lea, noah] = DEMO_FRIENDS_LIVE;
  return (
    <ScreenFrame label="Mes amis">
      <div className="space-y-2 rounded-lg border p-2.5 text-xs">
        <p>
          <span className="font-semibold">{lea!.name}</span> a terminé 45 min de {lea!.subject}
        </p>
        <span className="inline-flex items-center gap-1 rounded-pill bg-revio-social px-2.5 py-1 font-semibold text-revio-midnight">
          <HandHeart className="size-3.5" /> Bravo
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border p-2.5 text-xs">
        <span className="relative flex size-7 items-center justify-center rounded-full bg-brand-soft text-[0.6rem] font-bold text-brand-soft-foreground">
          {noah!.name.slice(0, 2).toUpperCase()}
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-revio-success" />
        </span>
        <span>
          <span className="font-semibold">{noah!.name}</span> révise en ce moment
        </span>
      </div>
      <p className="text-[0.7rem] text-muted-foreground">
        Jamais tes notes : seulement tes séances partagées.
      </p>
    </ScreenFrame>
  );
}

// ---- The day ---------------------------------------------------------------------------------------------------

type Step = { time: string; moment: string; heading: string; pillar: PillarId; Screen: () => ReactNode };

const STEPS: Step[] = [
  { time: "7 h 45", moment: "Matin", heading: "Je fais le point", pillar: "notes", Screen: NotesScreen },
  {
    time: "12 h 30",
    moment: "Midi",
    heading: "Je planifie ma semaine",
    pillar: "organiser",
    Screen: PlanScreen,
  },
  {
    time: "18 h",
    moment: "Soir",
    heading: "Je révise et je gagne de l'XP",
    pillar: "motivation",
    Screen: FocusScreen,
  },
  {
    time: "21 h 15",
    moment: "Nuit",
    heading: "Je partage avec mes amis",
    pillar: "amis",
    Screen: FriendsScreen,
  },
];

function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-[2rem] border-[6px] border-foreground/85 bg-card shadow-md",
        className,
      )}
    >
      <span className="absolute top-1.5 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded-pill bg-foreground/85" />
      <div className="pt-4">{children}</div>
    </div>
  );
}

/**
 * Variant B, "Une journée avec Revio": the four pillars told as four moments of a day. The steps unfold as the
 * page scrolls; on a large screen a phone stays in view and shows the screen of the current step (the phone is
 * decorative, the text says everything). A row of buttons jumps to a moment. With reduced motion the phone
 * changes screen at once and the page jumps instead of gliding.
 */
export function PillarsB({ id = "piliers" }: { id?: string }) {
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const node of steps.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const goTo = (i: number) => {
    setActive(i);
    steps.current[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    headings.current[i]?.focus({ preventScroll: true });
  };

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4">
        <PillarsHeading id={`${id}-title`} />
        <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <MockBadge /> Une journée inventée, pour montrer l&apos;idée.
        </p>

        <nav aria-label="Les moments de la journée" className="mt-8">
          <ul className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.moment}>
                <button
                  type="button"
                  aria-current={i === active ? "step" : undefined}
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-center justify-center rounded-lg border bg-card px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                    i === active && "border-brand bg-brand-soft text-brand-soft-foreground",
                  )}
                >
                  <span className="font-semibold">{s.moment}</span>
                  <span className="text-xs">{s.time}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-12">
          <ol className="relative">
            {/* The rail of the day, filled up to the current step. */}
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-[1.0625rem] w-0.5 rounded-pill bg-border"
            />
            <span
              aria-hidden
              className="absolute top-2 left-[1.0625rem] w-0.5 origin-top rounded-pill bg-ring transition-transform duration-500 motion-reduce:transition-none"
              style={{ bottom: "0.5rem", transform: `scaleY(${(active + 1) / STEPS.length})` }}
            />
            {STEPS.map((s, i) => {
              const p = pillar(s.pillar);
              const reached = i <= active;
              return (
                <li
                  key={s.moment}
                  ref={(el) => {
                    steps.current[i] = el;
                  }}
                  data-step={i}
                  className="relative grid grid-cols-[2.25rem_1fr] gap-4 pb-12 last:pb-0 lg:min-h-[36vh]"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-300 motion-reduce:transition-none",
                      reached ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-brand-text">
                      {s.time} · {s.moment}
                    </p>
                    <h3
                      ref={(el) => {
                        headings.current[i] = el;
                      }}
                      tabIndex={-1}
                      className="landing-display text-3xl outline-none sm:text-4xl"
                    >
                      {s.heading}
                    </h3>
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <p.icon className="size-4 text-brand-text" aria-hidden />
                      <span className="font-semibold">{p.title}</span>
                      <PillarStatusBadge status={p.status} />
                    </p>
                    <p className="max-w-prose text-muted-foreground">{p.text}</p>
                    <ul className="flex flex-wrap gap-2 text-xs">
                      {p.points.map((pt) => (
                        <li key={pt} className="rounded-pill border bg-card px-2.5 py-1">
                          {pt}
                        </li>
                      ))}
                    </ul>
                    {/* On a phone, the screen of the step sits under its text. */}
                    <Phone className="mt-4 max-w-[17rem] lg:hidden">
                      <s.Screen />
                    </Phone>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* On a large screen, one phone stays in view and follows the steps. */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <Phone>
                <div className="relative h-[21rem]">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.moment}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
                        i === active ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <s.Screen />
                    </div>
                  ))}
                </div>
              </Phone>
              <p className="text-center text-xs text-muted-foreground">
                Écran d&apos;exemple : {STEPS[active]!.moment.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
        <AveragesNote />
      </Reveal>
    </section>
  );
}
