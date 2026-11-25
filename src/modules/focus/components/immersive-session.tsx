"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Text of the big timer, already formatted ("12:34", or "--:--" before the first tick). */
  time: string;
  /** What the timer shows, for screen readers: "Temps restant" or "Temps écoulé". */
  timerLabel: string;
  paused: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onClose: () => void;
};

const FOCUSABLE = "button:not([disabled])";

/**
 * Sober full-screen view of the running session: the big timer, Pause/Resume and Finish, nothing else.
 * It only displays and forwards clicks: the session actions and the XP rules are the ones of the normal
 * panel (this component calls nothing on the server). A small close button is kept for touch screens;
 * Escape closes it on a keyboard. Motion: none at all, so `prefers-reduced-motion` is respected.
 */
export function ImmersiveSession({
  time,
  timerLabel,
  paused,
  busy,
  onPause,
  onResume,
  onFinish,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden"; // the page behind must not scroll
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      // Focus trap: Tab and Shift+Tab stay on the dialog's buttons.
      const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (!dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = overflow;
      previousFocus.current?.focus();
    };
  }, [onClose]);

  // A portal under <body>: the dialog covers the whole screen whatever the layout around it does.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Séance en plein écran"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-background px-4 text-foreground"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 size-11 motion-reduce:transition-none"
        aria-label="Quitter le plein écran (Échap)"
        onClick={onClose}
      >
        <X aria-hidden />
      </Button>

      <p
        role="timer"
        aria-label={timerLabel}
        className="font-heading text-7xl font-bold tabular-nums sm:text-9xl"
      >
        {time}
      </p>
      <p role="status" className="sr-only">
        {paused ? "Séance en pause" : "Séance en cours"}
      </p>

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        {paused ? (
          <Button
            size="lg"
            className="min-h-14 flex-1 text-lg motion-reduce:transition-none"
            disabled={busy}
            onClick={onResume}
          >
            <Play aria-hidden /> Reprendre
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            className="min-h-14 flex-1 text-lg motion-reduce:transition-none"
            disabled={busy}
            onClick={onPause}
          >
            <Pause aria-hidden /> Pause
          </Button>
        )}
        <Button
          size="lg"
          className="min-h-14 flex-1 text-lg motion-reduce:transition-none"
          disabled={busy}
          onClick={onFinish}
        >
          <Square aria-hidden /> Terminer
        </Button>
      </div>
    </div>,
    document.body,
  );
}
