"use client";

import { cn } from "@/lib/utils";
import { PERIODS, type PeriodId } from "../../domain/leaderboard";

/**
 * Period filter. Only the periods the server can answer are enabled; the others stay visible
 * and say "bientôt", so nothing pretends to work.
 */
export function PeriodFilter({
  value,
  available,
  onChange,
}: {
  value: PeriodId;
  available: readonly PeriodId[];
  onChange: (period: PeriodId) => void;
}) {
  return (
    <div role="group" aria-label="Période du classement" className="flex flex-wrap gap-2">
      {PERIODS.map((p) => {
        const enabled = available.includes(p.id);
        const pressed = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={pressed}
            disabled={!enabled}
            onClick={() => onChange(p.id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              pressed ? "border-brand bg-brand text-brand-foreground" : enabled && "hover:bg-muted",
            )}
          >
            {p.label}
            {!enabled && <span className="text-xs font-normal">bientôt</span>}
          </button>
        );
      })}
    </div>
  );
}
