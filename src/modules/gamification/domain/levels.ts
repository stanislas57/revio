/**
 * Levels and streak milestones — Revio convention, editable.
 * Pure: usable from client components and from the server.
 */

import type { LevelInfo, LevelProgress } from "../contracts";

export const LEVELS: readonly LevelInfo[] = [
  { number: 1, name: "Novice", minXp: 0 },
  { number: 2, name: "Apprenti", minXp: 500 },
  { number: 3, name: "Confirmé", minXp: 1500 },
  { number: 4, name: "Challenger", minXp: 3000 },
  { number: 5, name: "Expert", minXp: 5000 },
  { number: 6, name: "Master", minXp: 10000 },
  { number: 7, name: "Élite", minXp: 20000 },
  { number: 8, name: "Légende", minXp: 50000 },
];

export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 21, 30, 50, 100, 200, 365];

export function levelProgress(totalXp: number): LevelProgress {
  if (!Number.isFinite(totalXp)) throw new RangeError("XP invalide.");
  const xp = Math.max(0, Math.floor(totalXp));
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]!.minXp) index = i;
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  return {
    totalXp: xp,
    current,
    next,
    xpIntoLevel: xp - current.minXp,
    xpUntilNextLevel: next ? next.minXp - xp : null,
    progress: next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1,
  };
}

/** Smallest milestone strictly above `days`, null after the last one. */
export function nextStreakMilestone(days: number): number | null {
  return STREAK_MILESTONES.find((m) => m > days) ?? null;
}
