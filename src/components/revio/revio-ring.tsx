"use client";

// Inspiration : Magic UI — Animated Circular Progress Bar (MIT) · implémentation originale pour Revio
import type { ReactNode } from "react";
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
  /** A friend is studying right now: green dot. */
  live?: boolean;
  gainValue?: never;
  label?: never;
};

/**
 * The ring (charter: the Focus timer and the progress circles). Violet arc on a soft-purple track.
 * - `progress`: the last segment (the recent gain) in lime, percentage in the centre.
 * - `presence`: around an avatar or a timer, green "live" dot (decorative: the name, the subject and the
 *   duration are written next to it).
 */
export function RevioRing(props: ProgressProps | PresenceProps) {
  const { value, size = 120, stroke = 10, className, children } = props;
  const reduced = useReducedMotion();
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
        <circle
          cx={c}
          cy={c}
          r={g.radius}
          fill="none"
          stroke="var(--revio-primary-light)"
          strokeWidth={stroke}
        />
        {presence
          ? arc(g.baseLength, 0, "var(--ring)", "presence")
          : [
              arc(g.baseLength, 0, "var(--ring)", "base"),
              g.gainLength > 0 ? arc(g.gainLength, g.gainOffset, "var(--revio-lime)", "gain") : null,
            ]}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: stroke + 2 }}>
        {children ?? (
          <span className="font-heading text-2xl font-extrabold tabular-nums">
            {g.percent}
            <span className="text-base">%</span>
          </span>
        )}
      </div>
      {presence && props.live && (
        <span
          aria-hidden
          className="absolute right-0 bottom-0 rounded-full border-[3px] border-background bg-revio-success"
          style={{ width: Math.max(12, size * 0.23), height: Math.max(12, size * 0.23) }}
        />
      )}
    </div>
  );
}
