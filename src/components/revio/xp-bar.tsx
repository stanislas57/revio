"use client";

// Inspiration : Motion Primitives — Sliding Number (MIT), shadcn/ui — Progress (MIT) · implémentation originale pour Revio
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { clamp01 } from "./logic";

/**
 * Level, XP bar with the recent gain in lime (always a midnight "+N XP" label), sliding figures.
 * `primary`: the bar sits on a Revio Purple surface (the charter's level card): lime fill, white text.
 */
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
  tone?: "light" | "primary";
}) {
  const reduced = useReducedMotion();
  const total = clamp01(xp / xpMax);
  const gainPart = Math.min(total, clamp01(gain / xpMax));
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 24 };
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="font-heading font-bold">Niv. {level}</span>
        {gain > 0 && (
          <span className="rounded-pill bg-revio-lime px-2 py-0.5 text-xs font-bold text-revio-midnight">
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
          tone === "primary" ? "bg-white/30" : "bg-revio-primary-light",
        )}
      >
        <motion.span
          className={cn("h-full", tone === "primary" ? "bg-revio-lime" : "bg-ring")}
          initial={false}
          animate={{ width: `${(total - gainPart) * 100}%` }}
          transition={spring}
        />
        <motion.span
          className={cn("h-full", tone === "primary" ? "bg-white" : "bg-revio-lime")}
          initial={false}
          animate={{ width: `${gainPart * 100}%` }}
          transition={spring}
        />
      </div>
      <p className={cn("text-center text-xs", tone === "primary" ? "text-white" : "text-muted-foreground")}>
        <AnimatedNumber value={xp} /> / {new Intl.NumberFormat("fr-FR").format(xpMax)} XP
      </p>
    </div>
  );
}
