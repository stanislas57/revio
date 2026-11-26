"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { MOTION_STORAGE_KEY } from "./motion-script";

/**
 * "Réduire les animations": a device preference (localStorage) applied as `html[data-motion="reduce"]`, which
 * stops every continuous animation (globals.css). It complements `prefers-reduced-motion` and lets anyone stop
 * the breathing shapes (WCAG 2.2.2). The inline script of the root layout applies it before the first paint.
 */

const EVENT = "revio-motion-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readReduced(): boolean {
  try {
    return localStorage.getItem(MOTION_STORAGE_KEY) === "reduce";
  } catch {
    return false;
  }
}

export function setReducedMotion(reduce: boolean) {
  try {
    if (reduce) localStorage.setItem(MOTION_STORAGE_KEY, "reduce");
    else localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the setting still applies to this page.
  }
  if (reduce) document.documentElement.dataset.motion = "reduce";
  else delete document.documentElement.dataset.motion;
  window.dispatchEvent(new Event(EVENT));
}

export function MotionToggle({ className }: { className?: string }) {
  const reduced = useSyncExternalStore(subscribe, readReduced, () => false);
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={reduced}
        aria-describedby="motion-hint"
        onClick={() => setReducedMotion(!reduced)}
        className="inline-flex min-h-11 items-center gap-3 rounded-2xl border-2 bg-card px-4 font-bold shadow-[0_4px_0_var(--edge-neutral)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-1 active:shadow-none"
      >
        <span
          aria-hidden
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            reduced ? "bg-primary" : "bg-muted-foreground/40",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]",
              reduced ? "left-[1.375rem]" : "left-0.5",
            )}
          />
        </span>
        Réduire les animations
      </button>
      <p id="motion-hint" className="text-sm text-muted-foreground">
        Arrête les formes qui respirent et les dégradés qui bougent, sur cet appareil.
      </p>
    </div>
  );
}
