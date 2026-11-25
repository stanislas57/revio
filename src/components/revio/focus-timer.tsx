"use client";

// Inspiration : Motion Primitives — Text Morph (MIT) · implémentation originale pour Revio
import { Pause, Play, Square } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RevioRing } from "./revio-ring";
import { formatClock } from "./logic";

/**
 * The Focus screen of the charter: white card, big violet ring, timer, lime "+XP" band, and a label that morphs
 * from "Focus" to "Pause".
 * It only displays: the session itself (and its XP) stays in the Focus module.
 */
export function FocusTimer({
  subject,
  elapsedSeconds,
  totalSeconds,
  paused,
  xpAtEnd,
  onToggle,
  onFinish,
}: {
  subject: string;
  elapsedSeconds: number;
  totalSeconds: number;
  paused: boolean;
  xpAtEnd: number;
  onToggle: () => void;
  onFinish: () => void;
}) {
  const reduced = useReducedMotion();
  const label = paused ? "Pause" : "Focus";
  return (
    <section
      aria-label="Séance Focus"
      className="flex flex-col items-center gap-6 rounded-xl border bg-card px-6 py-8 text-card-foreground shadow-sm"
    >
      <p className="text-sm text-muted-foreground">{subject} · Notifications coupées</p>
      <div
        role="timer"
        aria-label={`Temps écoulé ${formatClock(elapsedSeconds)} sur ${formatClock(totalSeconds)}`}
      >
        <RevioRing variant="presence" value={elapsedSeconds / totalSeconds} size={240} stroke={14}>
          <span className="flex flex-col items-center">
            <span
              aria-hidden
              className="relative h-6 w-20 overflow-hidden text-center text-sm font-semibold text-muted-foreground"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={label}
                  className="absolute inset-0"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.18 }}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </span>
            <span aria-hidden className="font-heading text-5xl font-extrabold tabular-nums">
              {formatClock(elapsedSeconds)}
            </span>
            <span aria-hidden className="text-xs text-muted-foreground">
              sur {formatClock(totalSeconds)}
            </span>
          </span>
        </RevioRing>
      </div>
      <p role="status" className="sr-only">
        {paused ? "Séance en pause" : "Séance en cours"}
      </p>
      <span className="w-full rounded-md bg-revio-lime px-3 py-2.5 text-sm font-semibold text-revio-midnight">
        +{xpAtEnd} XP à la fin de la session
      </span>
      <div className="flex w-full max-w-xs gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors duration-150 outline-none hover:bg-revio-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
        >
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          {paused ? "Reprendre" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-secondary text-sm font-semibold text-secondary-foreground transition-colors duration-150 outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
        >
          <Square className="size-4" aria-hidden /> Terminer
        </button>
      </div>
    </section>
  );
}
