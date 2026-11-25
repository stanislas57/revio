"use client";

// Inspiration : Animate UI — Motion Highlight (MIT) · implémentation originale pour Revio
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Award, Flame, Heart, SmilePlus, Zap, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ReactionId = "flame" | "zap" | "heart" | "award";

export const REACTIONS: { id: ReactionId; label: string; Icon: LucideIcon }[] = [
  { id: "flame", label: "Feu", Icon: Flame },
  { id: "zap", label: "Éclair", Icon: Zap },
  { id: "heart", label: "Cœur", Icon: Heart },
  { id: "award", label: "Bravo", Icon: Award },
];

const LONG_PRESS_MS = 450;

/**
 * Four reactions (Lucide icons) that open on long press, on hover, or with the keyboard (Enter, Space, arrow up).
 * Arrow keys move between them, Escape closes. The chosen icon grows with a spring. No public counter.
 */
export function ReactionBar({
  value,
  onChange,
}: {
  value: ReactionId | null;
  onChange: (value: ReactionId | null) => void;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const focusFirst = useRef(false);
  const Current = REACTIONS.find((r) => r.id === value)?.Icon ?? SmilePlus;

  useEffect(() => {
    if (!open) return;
    if (focusFirst.current) {
      items.current[
        Math.max(
          0,
          REACTIONS.findIndex((r) => r.id === value),
        )
      ]?.focus();
      focusFirst.current = false;
    }
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, value]);

  function onTriggerKey(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
      e.preventDefault();
      focusFirst.current = true;
      setOpen(true);
    }
  }

  function onItemKey(e: KeyboardEvent, index: number) {
    const last = REACTIONS.length - 1;
    const target =
      e.key === "ArrowRight"
        ? (index + 1) % REACTIONS.length
        : e.key === "ArrowLeft"
          ? (index - 1 + REACTIONS.length) % REACTIONS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (target !== null) {
      e.preventDefault();
      items.current[target]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>("[data-trigger]")?.focus();
    }
  }

  return (
    <div
      ref={root}
      className="relative inline-block"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        data-trigger
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          value ? `Ta réaction : ${REACTIONS.find((r) => r.id === value)!.label}. Changer` : "Réagir"
        }
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-pill border bg-card outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          value && "border-brand text-brand-text",
        )}
        onKeyDown={onTriggerKey}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          timer.current = window.setTimeout(() => setOpen(true), LONG_PRESS_MS);
        }}
        onPointerUp={() => window.clearTimeout(timer.current)}
        onPointerCancel={() => window.clearTimeout(timer.current)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <Current className="size-5" aria-hidden />
      </button>
      {open && (
        <div
          role="group"
          aria-label="Choisir une réaction"
          className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-pill border bg-popover p-1 shadow-lg"
        >
          {REACTIONS.map(({ id, label, Icon }, i) => {
            const active = id === value;
            return (
              <motion.button
                key={id}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                aria-label={label}
                aria-pressed={active}
                onKeyDown={(e) => onItemKey(e, i)}
                onClick={() => {
                  onChange(active ? null : id);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-11 items-center justify-center rounded-pill outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active ? "bg-secondary text-brand-text" : "text-muted-foreground hover:text-foreground",
                )}
                animate={{ scale: active && !reduced ? 1.2 : 1 }}
                whileHover={reduced ? undefined : { scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Icon className="size-5" aria-hidden />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
