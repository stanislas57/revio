"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Square, X } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import type { ActiveSession } from "../contracts";
import { clockOffsetMs, elapsedSeconds, formatDuration } from "../domain/elapsed";
import {
  cancelSession,
  finishSession,
  heartbeatSession,
  pauseSession,
  resumeSession,
} from "../server/actions";
import { useNow } from "./use-now";

const HEARTBEAT_MS = 60_000;

/**
 * Running-session screen. The displayed time is computed from the server
 * timestamps (never a bare counter), so a reload or a second tab stays correct.
 */
export function ActiveSessionPanel({ session }: { session: ActiveSession }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [offset] = useState(() => clockOffsetMs(session.serverNow, Date.now()));
  const localNow = useNow();
  const paused = session.status === "paused";

  // Keeps the session "online" for friends while this tab is visible.
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") void heartbeatSession(session.id);
    };
    beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [session.id]);

  const elapsed = localNow === null ? null : elapsedSeconds(session, localNow + offset);
  const planned = session.plannedMinutes ? session.plannedMinutes * 60 : null;
  const remaining = planned !== null && elapsed !== null ? planned - elapsed : null;
  const timeUp = remaining !== null && remaining <= 0;

  const run = (fn: () => Promise<ActionResult<unknown>>, then?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error.message);
      else then?.();
    });

  return (
    <section
      aria-label="Séance en cours"
      className="flex flex-col items-center gap-6 rounded-xl border px-4 py-10 text-center"
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{paused ? "En pause" : "Séance en cours"}</p>
        <h2 className="text-xl font-semibold">{session.subject?.name ?? "Révision"}</h2>
      </div>

      <p
        className="font-mono text-6xl font-bold tabular-nums sm:text-7xl"
        role="timer"
        aria-label={planned ? "Temps restant" : "Temps écoulé"}
      >
        {elapsed === null
          ? "--:--"
          : formatDuration(planned !== null ? Math.max(0, remaining ?? 0) : elapsed)}
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
        <p className="text-sm text-muted-foreground">Écoulé : {formatDuration(elapsed)}</p>
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
          onClick={() =>
            run(
              () => finishSession(session.id),
              () => router.push(`/focus/seance/${session.id}`),
            )
          }
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
            run(() => cancelSession(session.id));
          }
        }}
      >
        <X aria-hidden /> Abandonner
      </Button>
    </section>
  );
}
