"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MockBadge } from "@/components/states/not-implemented";
import { cn } from "@/lib/utils";
import { DEMO_FRIENDS_LIVE, DEMO_SESSION_XP, DEMO_XP } from "../demo-data";
import { FriendsDemo, GradeSimulator, PlanDemo, StreakDemo, XpDemo } from "./pillar-demos";
import { AveragesNote, PillarStatusBadge, PillarsHeading, pillar, type PillarId } from "./pillars-content";
import { Reveal } from "./reveal";
import { useInViewOnce, usePrefersReducedMotion } from "./use-in-view-once";

function Tile({
  pillarId,
  subtitle,
  caption,
  className,
  children,
}: {
  pillarId: PillarId;
  subtitle?: string;
  caption?: string;
  className?: string;
  children: ReactNode;
}) {
  const p = pillar(pillarId);
  return (
    <article
      aria-labelledby={`bento-${pillarId}-${subtitle ?? "main"}`}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 text-center shadow-sm transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none",
        className,
      )}
    >
      <header className="space-y-2">
        <div className="flex flex-col items-center gap-2">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"
          >
            <p.icon className="size-5" />
          </span>
          <PillarStatusBadge status={p.status} />
        </div>
        <h3 id={`bento-${pillarId}-${subtitle ?? "main"}`} className="text-xl font-extrabold">
          {p.title}
          {subtitle && <span className="font-semibold text-muted-foreground"> · {subtitle}</span>}
        </h3>
        {caption && <p className="text-sm text-muted-foreground">{caption}</p>}
      </header>
      <div className="flex-1">{children}</div>
    </article>
  );
}

/**
 * The four pillars as a bento grid where each tile reacts. When the grid comes into view, once: the XP figure
 * climbs by the XP of a session, the streak lights up day after day, friends switch to "en révision". Every
 * tile also has its own buttons. With reduced motion the final state is shown at once; nothing moves in a loop.
 */
export function Pillars({ id = "piliers" }: { id?: string }) {
  const grid = useRef<HTMLUListElement>(null);
  const inView = useInViewOnce(grid);
  const reduced = usePrefersReducedMotion();
  const [lit, setLit] = useState(0);
  const [studying, setStudying] = useState(1);

  // Streak: one more day lit every 160 ms, up to six. Friends: one more "en révision" every 700 ms, up to three.
  useEffect(() => {
    if (!inView || reduced || lit >= 6) return;
    const t = window.setTimeout(() => setLit((n) => n + 1), lit === 0 ? 300 : 160);
    return () => window.clearTimeout(t);
  }, [inView, reduced, lit]);
  useEffect(() => {
    if (!inView || reduced || studying >= 3) return;
    const t = window.setTimeout(() => setStudying((n) => n + 1), 700);
    return () => window.clearTimeout(t);
  }, [inView, reduced, studying]);

  const litDays = reduced ? 6 : lit;
  const live = new Set(DEMO_FRIENDS_LIVE.slice(0, reduced ? 3 : studying).map((f) => f.name));

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4">
        <PillarsHeading id={`${id}-title`} />
        <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <MockBadge /> Chaque case réagit : touche les boutons. Exemples, données inventées.
        </p>
        <ul ref={grid} className="mt-10 grid gap-4 md:grid-cols-6">
          <li className="md:col-span-4 md:row-span-2">
            <Tile
              pillarId="notes"
              caption="Et si j'avais 14 en Droit ? Change la note, la moyenne suit."
              className="h-full"
            >
              <GradeSimulator />
            </Tile>
          </li>
          <li className="md:col-span-2">
            <Tile pillarId="motivation" subtitle="XP" className="h-full">
              <XpDemo climbFrom={DEMO_XP - DEMO_SESSION_XP} active={inView} />
            </Tile>
          </li>
          <li className="md:col-span-2">
            <Tile pillarId="motivation" subtitle="Série" className="h-full">
              <StreakDemo litDays={litDays} />
            </Tile>
          </li>
          <li className="md:col-span-3">
            <Tile
              pillarId="amis"
              caption="Tu vois qui révise, tu encourages. Jamais tes notes."
              className="h-full"
            >
              <FriendsDemo studyingNow={live} />
            </Tile>
          </li>
          <li className="md:col-span-3">
            <Tile pillarId="organiser" caption="Coche une séance : la semaine avance." className="h-full">
              <PlanDemo />
            </Tile>
          </li>
        </ul>
        <AveragesNote />
      </Reveal>
    </section>
  );
}
