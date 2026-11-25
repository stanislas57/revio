"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/lib/utils";
import type { Achievement } from "../contracts";
import {
  ACHIEVEMENT_FILTERS,
  applyFilter,
  countByFilter,
  sortAchievements,
  type FilterId,
} from "../domain/achievements";
import { AchievementCard } from "./achievement-card";
import { AchievementDialog } from "./achievement-dialog";

/**
 * Trophy gallery: seven filters, a card per achievement (locked, in progress, unlocked) and a
 * detail window. Pure display: it receives the achievements (fixtures until the server exists).
 */
export function AchievementGallery({
  achievements,
  now,
}: {
  achievements: readonly Achievement[];
  now: string;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<Achievement | null>(null);

  const counts = useMemo(() => countByFilter(achievements), [achievements]);
  const shown = useMemo(() => sortAchievements(applyFilter(achievements, filter)), [achievements, filter]);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Filtrer les trophées" className="flex flex-wrap gap-2">
        {ACHIEVEMENT_FILTERS.map((f) => {
          const pressed = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                pressed ? "border-brand bg-brand text-brand-foreground" : "hover:bg-muted",
              )}
            >
              {f.label}
              <span
                className={cn("tabular-nums", pressed ? "text-brand-foreground" : "text-muted-foreground")}
              >
                ({counts[f.id]})
              </span>
            </button>
          );
        })}
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        {shown.length} trophée{shown.length > 1 ? "s" : ""} affiché{shown.length > 1 ? "s" : ""}
      </p>

      {shown.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <li key={a.id} className="flex">
              <AchievementCard achievement={a} now={now} onOpen={setSelected} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Aucun trophée ici"
          description="Aucun trophée ne correspond à ce filtre pour le moment."
        />
      )}

      <AchievementDialog achievement={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
