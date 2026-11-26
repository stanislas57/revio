"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Inspiration : Duolingo (grandes cases de réponse) et shadcn/ui — Radio Group (MIT) · implémentation originale pour Revio

export type Choice<V extends string> = {
  value: V;
  label: string;
  /** A short second line under the label. */
  hint?: string;
  icon?: ReactNode;
};

/**
 * A grid of big chunky choice tiles that behaves like a radio group: arrow keys move between tiles, Space or
 * Enter (or a click) selects, the selected tile is highlighted (violet border, soft purple, a check mark, and
 * `aria-checked`). Tiles are at least 56 px high and centred.
 */
export function ChoiceGrid<V extends string>({
  label,
  description,
  choices,
  value,
  onChange,
  columns = 2,
  className,
}: {
  /** Read by screen readers as the group's name (and shown, unless `description` replaces it visually). */
  label: string;
  description?: string;
  choices: readonly Choice<V>[];
  value: V | null;
  onChange: (value: V) => void;
  /** Columns from 640 px up (one or two below, depending on the label length). */
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = choices.findIndex((c) => c.value === value);
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = choices.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (index + 1) % choices.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (index - 1 + choices.length) % choices.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(choices[next]!.value);
  }

  return (
    <div className={cn("mx-auto w-full max-w-2xl space-y-4 text-center", className)}>
      <div className="space-y-1">
        <p id={`${id}-label`} className="text-xl font-extrabold">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cn(
          "grid grid-cols-2 gap-3",
          columns === 3 && "sm:grid-cols-3",
          columns === 4 && "sm:grid-cols-4",
        )}
      >
        {choices.map((c, i) => {
          const selected = c.value === value;
          return (
            <button
              key={c.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={i === focusIndex ? 0 : -1}
              onClick={() => onChange(c.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card px-3 py-3 text-center font-bold transition-[transform,box-shadow,background-color,border-color] duration-100 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-1 active:shadow-none motion-reduce:transition-none motion-reduce:active:translate-y-0",
                selected
                  ? "border-brand bg-brand-soft text-brand-soft-foreground shadow-[0_4px_0_var(--edge-primary)]"
                  : "shadow-[0_4px_0_var(--edge-neutral)] hover:bg-muted",
              )}
            >
              {selected && (
                <span
                  aria-hidden
                  className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground"
                >
                  <Check className="size-3.5" />
                </span>
              )}
              {c.icon && <span aria-hidden>{c.icon}</span>}
              <span>{c.label}</span>
              {c.hint && <span className="text-xs font-medium text-muted-foreground">{c.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
