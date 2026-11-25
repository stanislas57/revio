"use client";

// Inspiration : Magic UI — Animated Circular Progress Bar (MIT) · implémentation originale pour Revio
import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ringGeometry } from "./logic";

type Common = {
  /** Progress, 0 to 1. */
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: ReactNode;
  /** `ink`: the ring sits on an ink surface (darker track). */
  tone?: "light" | "ink";
};

type ProgressProps = Common & {
  variant?: "progress";
  /** The recent gain, 0 to 1: the last part of the arc, drawn in lime. */
  gainValue?: number;
  /** Text read by screen readers: "Progression du chapitre". The percentage is added. */
  label: string;
  live?: never;
};

type PresenceProps = Common & {
  variant: "presence";
  /** A friend is studying right now: magenta dot. */
  live?: boolean;
  gainValue?: never;
  label?: never;
};

/**
 * The ring, central sign of the design.
 * - `progress`: violet arc, the last segment (the recent gain) in lime, percentage in the centre.
 * - `presence`: violet to magenta gradient around an avatar, magenta "live" dot (decorative: the name, the
 *   subject and the duration are written next to it).
 */
export function RevioRing(props: ProgressProps | PresenceProps) {
  const { value, size = 120, stroke = 10, className, children, tone = "light" } = props;
  const reduced = useReducedMotion();
  const gradientId = useId();
  const presence = props.variant === "presence";
  const g = ringGeometry(size, stroke, value, presence ? 0 : (props.gainValue ?? 0));
  const c = size / 2;
  const transition = reduced ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const };

  const arc = (length: number, offset: number, color: string, key: string) => (
    <motion.circle
      key={key}
      cx={c}
      cy={c}
      r={g.radius}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      transform={`rotate(-90 ${c} ${c})`}
      strokeDashoffset={offset}
      initial={{ strokeDasharray: `0 ${g.circumference}` }}
      animate={{ strokeDasharray: `${length} ${g.circumference}` }}
      transition={transition}
    />
  );

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...(presence
        ? { "aria-hidden": true }
        : {
            role: "progressbar",
            "aria-label": props.label,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": g.percent,
          })}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {presence && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--revio-violet)" />
              <stop offset="1" stopColor="var(--revio-magenta)" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={c}
          cy={c}
          r={g.radius}
          fill="none"
          stroke={tone === "ink" ? "var(--revio-ink-3)" : "var(--border)"}
          strokeWidth={stroke}
        />
        {presence
          ? arc(g.baseLength, 0, `url(#${gradientId})`, "presence")
          : [
              arc(g.baseLength, 0, tone === "ink" ? "var(--revio-violet-on-ink)" : "var(--brand)", "base"),
              g.gainLength > 0 ? arc(g.gainLength, g.gainOffset, "var(--revio-xp)", "gain") : null,
            ]}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: stroke + 2 }}>
        {children ?? (
          <span className="font-heading text-2xl font-bold tabular-nums">
            {g.percent}
            <span className="text-base">%</span>
          </span>
        )}
      </div>
      {presence && props.live && (
        <span
          aria-hidden
          className="absolute right-0 bottom-0 rounded-full border-[3px] border-background bg-revio-magenta"
          style={{ width: Math.max(12, size * 0.23), height: Math.max(12, size * 0.23) }}
        />
      )}
    </div>
  );
}
