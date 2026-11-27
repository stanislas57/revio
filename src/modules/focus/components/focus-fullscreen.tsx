"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, Square, X } from "lucide-react";
import { AnimatedNumber } from "@/components/revio/animated-number";
import { Button } from "@/components/ui/button";
import { XP_RULES } from "@/modules/gamification/domain/xp";

type Props = {
  /** Text of the big timer, already formatted ("12:34", or "--:--" before the first tick). */
  time: string;
  /** What the timer shows, for screen readers: "Temps restant" or "Temps écoulé". */
  timerLabel: string;
  /** XP of the session so far, estimated with the real rules (`liveXpEstimate`). */
  xp: number;
  paused: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onClose: () => void;
};

const FOCUSABLE = "button:not([disabled])";
const noopSubscribe = () => () => {};

/** The XP counter: lime pill (midnight text), the number slides, and a "+N XP" floats up when it grows. */
function XpCounter({ xp }: { xp: number }) {
  const [seen, setSeen] = useState(xp);
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  // Derived during render (no effect): a growth of the estimate starts one floating "+N XP".
  if (xp !== seen) {
    setSeen(xp);
    if (xp > seen) setGain({ n: xp - seen, key: (gain?.key ?? 0) + 1 });
  }
  return (
    <div className="relative flex flex-col items-center gap-2">
      <p className="inline-flex items-baseline gap-2 rounded-pill bg-revio-lime px-6 py-2 text-revio-midnight">
        <AnimatedNumber value={xp} className="font-heading text-4xl font-extrabold sm:text-5xl" />
        <span className="text-lg font-extrabold">XP</span>
      </p>
      <p className="text-sm text-white">
        {xp === 0
          ? `L'XP commence à la ${XP_RULES.minSessionMinutes}e minute.`
          : "XP de la séance, estimée : le total officiel arrive à la fin."}
      </p>
      {gain && (
        <span
          key={gain.key}
          aria-hidden
          className="xp-float pointer-events-none absolute -top-2 right-0 rounded-pill bg-revio-lime px-3 py-1 text-sm font-extrabold text-revio-midnight"
        >
          +{gain.n} XP
        </span>
      )}
      <p role="status" className="sr-only">
        {xp > 0 ? `${xp} XP pour cette séance, estimée.` : ""}
      </p>
    </div>
  );
}

/**
 * The full-screen Focus view, opened automatically when a session runs: the big timer, the XP of the session
 * that rises as you study, and a discreet Pause / Terminer. Nothing else: the navigation and the cards are
 * covered. It only displays and forwards clicks (the session actions and the XP rules are the ones of the normal
 * panel). The background is the Revio gradient, whose colours drift slowly (stopped by reduced motion). A small
 * close button is kept for touch screens; Escape closes it on a keyboard.
 */
export function FocusFullscreen({
  time,
  timerLabel,
  xp,
  paused,
  busy,
  onPause,
  onResume,
  onFinish,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  // The portal needs `document`: nothing is rendered on the server (the view opens by itself, so it would be).
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, onClose]);

  if (!mounted) return null;

  // A portal under <body>: the dialog covers the whole screen whatever the layout around it does.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Séance en plein écran"
      style={{ backgroundImage: "var(--revio-focus-gradient)" }}
      className="focus-enter revio-gradient-drift fixed inset-0 z-[100] flex flex-col items-center justify-center gap-12 px-4 text-center text-white"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 size-11 text-white hover:bg-white/15 hover:text-white motion-reduce:transition-none"
        aria-label="Quitter le plein écran (Échap)"
        onClick={onClose}
      >
        <X aria-hidden />
      </Button>

      <p
        role="timer"
        aria-label={timerLabel}
        className="font-heading text-7xl font-black tabular-nums sm:text-9xl"
      >
        {time}
      </p>

      <XpCounter xp={xp} />

      <p role="status" className="sr-only">
        {paused ? "Séance en pause" : "Séance en cours"}
      </p>

      <div className="flex w-full max-w-sm flex-wrap justify-center gap-3">
        {paused ? (
          <Button
            variant="outline"
            className="min-h-11 flex-1 border-white/60 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white motion-reduce:transition-none"
            disabled={busy}
            onClick={onResume}
          >
            <Play aria-hidden /> Reprendre
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-h-11 flex-1 border-white/60 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white motion-reduce:transition-none"
            disabled={busy}
            onClick={onPause}
          >
            <Pause aria-hidden /> Pause
          </Button>
        )}
        <Button
          variant="outline"
          className="min-h-11 flex-1 border-white/60 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white motion-reduce:transition-none"
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
