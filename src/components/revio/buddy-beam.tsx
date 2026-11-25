"use client";

// Inspiration : Magic UI — Animated Beam (MIT) · implémentation originale pour Revio
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

function Avatar({ initials, tone }: { initials: string; tone: "violet" | "magenta" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold text-revio-ink",
        tone === "violet"
          ? "border-revio-violet bg-revio-lilac"
          : "border-revio-magenta bg-[color-mix(in_oklab,var(--revio-magenta)_12%,white)]",
      )}
    >
      {initials}
    </span>
  );
}

/** The buddy: two avatars joined by a gradient beam, with the "Série à deux" counter. */
export function BuddyBeam({
  me,
  buddy,
  days,
  status,
}: {
  me: { name: string; initials: string };
  buddy: { name: string; initials: string };
  days: number;
  status: string;
}) {
  const reduced = useReducedMotion();
  return (
    <section aria-label={`Ton binôme : ${buddy.name}`} className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Ton binôme</h2>
        <span className="text-xs font-semibold text-revio-magenta-text">Série à deux · {days} j</span>
      </div>
      <div
        className="flex items-center gap-2"
        role="img"
        aria-label={`${me.name} et ${buddy.name}, série à deux de ${days} jours`}
      >
        <Avatar initials={me.initials} tone="violet" />
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-revio-border" aria-hidden>
          <div className="bg-revio-gradient absolute inset-0" />
          {!reduced && (
            <motion.span
              className="absolute top-0 h-full w-8 rounded-pill bg-white/70"
              initial={{ left: "-10%" }}
              animate={{ left: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          )}
        </div>
        <Avatar initials={buddy.initials} tone="magenta" />
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
    </section>
  );
}
