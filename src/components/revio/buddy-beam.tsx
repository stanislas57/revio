"use client";

// Inspiration : Magic UI — Animated Beam (MIT) · implémentation originale pour Revio
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

function Avatar({ initials, tone }: { initials: string; tone: "violet" | "pink" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
        tone === "violet"
          ? "border-revio-primary bg-brand-soft text-brand-soft-foreground"
          : "border-revio-social bg-card text-revio-social-text",
      )}
    >
      {initials}
    </span>
  );
}

/** The buddy: two avatars joined by a violet beam, with the "Série à deux" counter (streak orange). */
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
        <h2 className="font-heading text-lg font-bold">Ton binôme</h2>
        <span className="text-xs font-semibold text-revio-streak-text">Série à deux · {days} j</span>
      </div>
      <div
        className="flex items-center gap-2"
        role="img"
        aria-label={`${me.name} et ${buddy.name}, série à deux de ${days} jours`}
      >
        <Avatar initials={me.initials} tone="violet" />
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-revio-primary-light"
          aria-hidden
        >
          <div className="absolute inset-0 bg-revio-primary" />
          {!reduced && (
            <motion.span
              className="absolute top-0 h-full w-8 rounded-pill bg-white/70"
              initial={{ left: "-10%" }}
              animate={{ left: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          )}
        </div>
        <Avatar initials={buddy.initials} tone="pink" />
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
    </section>
  );
}
