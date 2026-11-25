"use client";

// Inspiration : Motion Primitives — Sliding Number (MIT), shadcn/ui — Progress (MIT) · implémentation originale pour Revio
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { clamp01 } from "./logic";

/** Level, XP bar with the recent gain in lime (always an ink "+N XP" label), sliding figures. */
export function XpBar({
  level,
  xp,
  xpMax,
  gain = 0,
  className,
  tone = "light",
}: {
  level: number;
  xp: number;
  xpMax: number;
  /** XP won recently, already included in `xp`. */
  gain?: number;
  className?: string;
  /** `ink`: the bar sits on an ink surface (sidebar, profile card). */
  tone?: "light" | "ink";
}) {
  const reduced = useReducedMotion();
  const total = clamp01(xp / xpMax);
  const gainPart = Math.min(total, clamp01(gain / xpMax));
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 24 };
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-heading font-semibold">Niv. {level}</span>
        {gain > 0 && (
          <span className="rounded-pill bg-revio-xp px-2 py-0.5 text-xs font-bold text-revio-ink">
            +{gain} XP
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={`Niveau ${level} : ${xp} sur ${xpMax} XP`}
        aria-valuemin={0}
        aria-valuemax={xpMax}
        aria-valuenow={xp}
        className={cn(
          "flex h-2.5 overflow-hidden rounded-pill",
          tone === "ink" ? "bg-revio-ink-3" : "bg-muted",
        )}
      >
        <motion.span
          className="h-full bg-brand"
          initial={false}
          animate={{ width: `${(total - gainPart) * 100}%` }}
          transition={spring}
          style={tone === "ink" ? { backgroundColor: "var(--revio-violet-on-ink)" } : undefined}
        />
        <motion.span
          className="h-full bg-revio-xp"
          initial={false}
          animate={{ width: `${gainPart * 100}%` }}
          transition={spring}
        />
      </div>
      <p className={cn("text-xs", tone === "ink" ? "text-revio-muted-on-ink" : "text-muted-foreground")}>
        <AnimatedNumber value={xp} /> / {new Intl.NumberFormat("fr-FR").format(xpMax)} XP
      </p>
    </div>
  );
}
