"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { cn } from "@/lib/utils";
import { FriendsDemo, GradeSimulator, PlanDemo, XpDemo } from "./pillar-demos";
import {
  AveragesNote,
  PILLARS,
  PillarStatusBadge,
  PillarsHeading,
  type Pillar,
  type PillarId,
} from "./pillars-content";
import { Reveal } from "./reveal";

const DEMOS: Record<PillarId, () => ReactNode> = {
  notes: () => <GradeSimulator />,
  organiser: () => <PlanDemo />,
  amis: () => <FriendsDemo />,
  motivation: () => <XpDemo />,
};

const DEMO_TITLE: Record<PillarId, string> = {
  notes: "Et si j'avais 14 en Droit ?",
  organiser: "Coche tes séances de la semaine",
  amis: "Envoie un bravo à un ami",
  motivation: "Termine une séance, gagne de l'XP",
};

/**
 * One card per pillar. The front tells the idea; "Essayer" turns the card over and shows a small interactive
 * demo. The hidden face is `inert` (out of the tab order and of the accessibility tree), the focus follows the
 * turn, and with reduced motion the card changes face at once, without rotating.
 */
function FlipCard({ pillar }: { pillar: Pillar }) {
  const [flipped, setFlipped] = useState(false);
  const turned = useRef(false);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backTitle = useRef<HTMLHeadingElement>(null);
  const { id, icon: Icon, title, text, points, status } = pillar;
  const Demo = DEMOS[id];

  useEffect(() => {
    if (!turned.current) return;
    (flipped ? backTitle.current : frontButton.current)?.focus();
  }, [flipped]);

  const turn = (value: boolean) => {
    turned.current = true;
    setFlipped(value);
  };

  return (
    <div className="h-full [perspective:1400px]">
      <div
        className={cn(
          "grid h-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front */}
        <article
          aria-labelledby={`flip-${id}-title`}
          inert={flipped}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm [backface-visibility:hidden] [grid-area:1/1]"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text"
            >
              <Icon className="size-6" />
            </span>
            <PillarStatusBadge status={status} />
          </div>
          <h3 id={`flip-${id}-title`} className="landing-display text-2xl sm:text-3xl">
            {title}
          </h3>
          <p className="text-muted-foreground">{text}</p>
          <ul className="flex flex-wrap gap-2 text-xs">
            {points.map((p) => (
              <li key={p} className="rounded-pill border px-2.5 py-1">
                {p}
              </li>
            ))}
          </ul>
          <button
            ref={frontButton}
            type="button"
            onClick={() => turn(true)}
            className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors outline-none hover:bg-revio-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
          >
            Essayer <span className="sr-only">: {title}</span>
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </article>

        {/* Back */}
        <article
          aria-labelledby={`flip-${id}-demo`}
          inert={!flipped}
          className="flex [transform:rotateY(180deg)] flex-col gap-4 rounded-2xl border border-brand bg-card p-6 shadow-sm [backface-visibility:hidden] [grid-area:1/1]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-widest text-brand-text uppercase">{title}</p>
            <MockBadge />
          </div>
          <h3 id={`flip-${id}-demo`} ref={backTitle} tabIndex={-1} className="text-lg font-bold outline-none">
            {DEMO_TITLE[id]}
          </h3>
          {/* Mounted only once the card is turned: its state starts fresh, and nothing hidden is rendered. */}
          <div className="flex-1">{flipped && <Demo />}</div>
          <button
            type="button"
            onClick={() => turn(false)}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border bg-card px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
          >
            <RotateCcw className="size-4" aria-hidden /> Retourner la carte
          </button>
        </article>
      </div>
    </div>
  );
}

/** Variant A, "Le jeu de cartes": four cards to turn over, each with an interactive example on its back. */
export function PillarsA({ id = "piliers" }: { id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4">
        <PillarsHeading id={`${id}-title`} />
        <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <MockBadge /> Retourne une carte pour essayer : exemples interactifs, données inventées.
        </p>
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {PILLARS.map((p) => (
            <li key={p.id}>
              <FlipCard pillar={p} />
            </li>
          ))}
        </ul>
        <AveragesNote />
      </Reveal>
    </section>
  );
}
