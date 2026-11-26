"use client";

// Inspiration : Animate UI — Checkbox (MIT), Magic UI — Confetti (MIT) · implémentation originale pour Revio
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { celebrate } from "./confetti";
import {
  chestJustOpened,
  claimDaily,
  dayKey,
  questDone,
  questProgress,
  questsDone,
  type Quest,
} from "./logic";

/**
 * The three quests of the day: animated check, mini progress bar and XP reward. The chest opens when the last
 * quest is done: confetti, once per day. Interactive only when `onToggle` is given (demo); otherwise read-only.
 */
export function QuestList({
  quests,
  chestXp = 120,
  onToggle,
}: {
  quests: Quest[];
  chestXp?: number;
  onToggle?: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const previous = useRef(quests);

  useEffect(() => {
    if (
      chestJustOpened(previous.current, quests) &&
      claimDaily(window.localStorage, "quest-chest", dayKey())
    ) {
      void celebrate();
    }
    previous.current = quests;
  }, [quests]);

  const done = questsDone(quests);
  return (
    <section aria-labelledby="quests-title" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="quests-title" className="font-heading text-lg font-semibold">
          Quêtes du jour
        </h2>
        <span className="text-xs text-muted-foreground">
          {done}/{quests.length} · coffre bonus +{chestXp} XP
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {quests.map((q) => {
          const finished = questDone(q);
          const showBar = q.target > 1;
          return (
            <li key={q.id} className="space-y-3 rounded-lg border bg-card p-4">
              <button
                type="button"
                role="checkbox"
                aria-checked={finished}
                aria-label={q.label}
                disabled={!onToggle}
                onClick={() => onToggle?.(q.id)}
                className="flex min-h-11 w-full items-start justify-center gap-3 rounded-sm text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
              >
                <motion.span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border-2",
                    finished ? "border-brand bg-brand text-brand-foreground" : "border-input bg-background",
                  )}
                  animate={{ scale: finished && !reduced ? [1, 1.18, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {finished && <Check className="size-4" strokeWidth={3} />}
                </motion.span>
                <span className={cn("text-sm", finished && "text-muted-foreground line-through")}>
                  {q.label}
                </span>
              </button>
              {showBar && (
                <div
                  role="progressbar"
                  aria-label={`${q.label} : ${q.current} sur ${q.target}`}
                  aria-valuemin={0}
                  aria-valuemax={q.target}
                  aria-valuenow={Math.min(q.current, q.target)}
                  className="h-1.5 overflow-hidden rounded-pill bg-muted"
                >
                  <motion.span
                    className="block h-full rounded-pill bg-brand"
                    initial={false}
                    animate={{ width: `${questProgress(q) * 100}%` }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
                  />
                </div>
              )}
              <p className="text-xs font-semibold">
                <span className="rounded-pill bg-revio-lime px-2 py-0.5 text-revio-midnight">+{q.xp} XP</span>
                {finished && <span className="ml-2 text-muted-foreground">fait</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
