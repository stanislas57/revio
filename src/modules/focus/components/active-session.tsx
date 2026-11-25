"use client";

import { useTransition } from "react";
import { Pause, Play, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import { elapsedSeconds, formatClock } from "../domain/time";
import type { SessionRow } from "../schemas";
import { abandonSession, completeSession, pauseSession, resumeSession } from "../server/actions";
import { useNow } from "./use-now";

/** Minimal running-session screen. Time comes from server timestamps, so a reload never loses it. */
export function ActiveSession({ session }: { session: SessionRow }) {
  const now = useNow();
  const [pending, startTransition] = useTransition();
  const paused = session.paused_at !== null;
  const elapsed =
    now === null
      ? null
      : elapsedSeconds(
          {
            startedAt: session.started_at,
            pausedSeconds: session.paused_seconds,
            pausedAt: session.paused_at,
          },
          now,
        );
  const planned = session.planned_minutes ? session.planned_minutes * 60 : null;
  const remaining = planned !== null && elapsed !== null ? planned - elapsed : null;
  const timeUp = remaining !== null && remaining <= 0;

  const run = (fn: () => Promise<{ error?: string } | undefined>) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
    });

  return (
    <section
      aria-label="Séance en cours"
      className="flex flex-col items-center gap-6 rounded-xl border px-4 py-10 text-center"
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{paused ? "En pause" : "Séance en cours"}</p>
        <h2 className="text-xl font-semibold">{session.label ?? "Révision"}</h2>
      </div>

      <p
        className="font-mono text-6xl font-bold tabular-nums sm:text-7xl"
        aria-live="off"
        aria-label={planned ? "Temps restant" : "Temps écoulé"}
      >
        {elapsed === null
          ? "--:--"
          : planned !== null
            ? formatClock(Math.max(0, remaining ?? 0))
            : formatClock(elapsed)}
      </p>

      {planned !== null && elapsed !== null && (
        <ProgressBar value={(elapsed / planned) * 100} label="Avancement de la séance" className="max-w-sm" />
      )}
      {timeUp && (
        <p role="status" className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Temps écoulé, bravo ! Tu peux terminer la séance ou continuer.
        </p>
      )}
      {planned !== null && elapsed !== null && !timeUp && (
        <p className="text-sm text-muted-foreground">Écoulé : {formatClock(elapsed)}</p>
      )}

      <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        {paused ? (
          <Button
            size="lg"
            className="flex-1"
            disabled={pending}
            onClick={() => run(() => resumeSession(session.id))}
          >
            <Play aria-hidden /> Reprendre
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            disabled={pending}
            onClick={() => run(() => pauseSession(session.id))}
          >
            <Pause aria-hidden /> Pause
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          disabled={pending}
          onClick={() => run(() => completeSession(session.id))}
        >
          <Square aria-hidden /> Terminer
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Abandonner cette séance ? Elle ne rapportera pas d'XP.")) {
            run(() => abandonSession(session.id));
          }
        }}
      >
        <X aria-hidden /> Abandonner
      </Button>
    </section>
  );
}
