/**
 * Achievement display logic (pure). The catalogue, the awarding and the progress are
 * computed by the server; this only decides how a given `Achievement` is shown and filtered.
 * Nothing here grants or computes a reward.
 */

import type { IsoDateTime } from "@/lib/contracts";
import type { Achievement } from "../contracts";

export type AchievementState = "locked" | "in_progress" | "unlocked";
export type AchievementCategory = Achievement["category"];

/** locked: nothing done yet · in_progress: started, not finished · unlocked: obtained. */
export function achievementState(a: Pick<Achievement, "unlockedAt" | "progress">): AchievementState {
  if (a.unlockedAt) return "unlocked";
  if (a.progress && a.progress.current > 0) return "in_progress";
  return "locked";
}

/** 0 to 100, or null when the achievement has no progress to show. Never above 100. */
export function progressPercent(a: Pick<Achievement, "progress">): number | null {
  if (!a.progress) return null;
  const { current, target } = a.progress;
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((current / target) * 100)));
}

const DAY_MS = 86_400_000;

/** Unlocked within the last `days` days (shown as "Nouveau"). */
export function isRecentlyUnlocked(
  a: Pick<Achievement, "unlockedAt">,
  now: IsoDateTime | Date,
  days = 7,
): boolean {
  if (!a.unlockedAt) return false;
  const at = Date.parse(a.unlockedAt);
  const ref = typeof now === "string" ? Date.parse(now) : now.getTime();
  if (Number.isNaN(at) || Number.isNaN(ref)) return false;
  return ref - at >= 0 && ref - at <= days * DAY_MS;
}

export const CATEGORY_LABEL: Readonly<Record<AchievementCategory, string>> = {
  regularity: "Régularité",
  level: "Progression",
  social: "Social",
  volume: "Performance",
};

export type FilterId =
  "all" | "unlocked" | "locked" | "regularity" | "progression" | "social" | "performance";

/** The seven filters of the gallery. The contract's `level` is "Progression", `volume` is "Performance". */
export const ACHIEVEMENT_FILTERS: readonly { id: FilterId; label: string; category?: AchievementCategory }[] =
  [
    { id: "all", label: "Tous" },
    { id: "unlocked", label: "Débloqués" },
    { id: "locked", label: "À débloquer" },
    { id: "regularity", label: "Régularité", category: "regularity" },
    { id: "progression", label: "Progression", category: "level" },
    { id: "social", label: "Social", category: "social" },
    { id: "performance", label: "Performance", category: "volume" },
  ];

export function matchesFilter(a: Achievement, filter: FilterId): boolean {
  const def = ACHIEVEMENT_FILTERS.find((f) => f.id === filter);
  if (!def || filter === "all") return true;
  if (filter === "unlocked") return achievementState(a) === "unlocked";
  // "À débloquer" = everything not obtained yet, started or not.
  if (filter === "locked") return achievementState(a) !== "unlocked";
  return a.category === def.category;
}

export function applyFilter(list: readonly Achievement[], filter: FilterId): Achievement[] {
  return list.filter((a) => matchesFilter(a, filter));
}

export function countByFilter(list: readonly Achievement[]): Record<FilterId, number> {
  const counts = {} as Record<FilterId, number>;
  for (const f of ACHIEVEMENT_FILTERS) counts[f.id] = applyFilter(list, f.id).length;
  return counts;
}

const STATE_ORDER: Record<AchievementState, number> = { unlocked: 0, in_progress: 1, locked: 2 };

/**
 * Gallery order: obtained first (newest first), then the ones in progress (closest first),
 * then the locked ones. Stable and without side effects.
 */
export function sortAchievements(list: readonly Achievement[]): Achievement[] {
  return [...list].sort((a, b) => {
    const sa = achievementState(a);
    const sb = achievementState(b);
    if (sa !== sb) return STATE_ORDER[sa] - STATE_ORDER[sb];
    if (sa === "unlocked") return Date.parse(b.unlockedAt ?? "") - Date.parse(a.unlockedAt ?? "");
    if (sa === "in_progress") return (progressPercent(b) ?? 0) - (progressPercent(a) ?? 0);
    return a.name.localeCompare(b.name, "fr");
  });
}

/** Text read by screen readers and shown under the name. */
export function stateLabel(state: AchievementState): string {
  return { locked: "Verrouillé", in_progress: "En cours", unlocked: "Débloqué" }[state];
}
