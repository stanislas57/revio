/**
 * Levels — Revio convention (provisional thresholds, edit this table only).
 * Levels are derived from total XP; the XP itself always comes from the server.
 */
export type LevelDef = { level: number; name: string; minXp: number };

export const LEVELS: readonly LevelDef[] = [
  { level: 1, name: "Novice", minXp: 0 },
  { level: 2, name: "Apprenti", minXp: 500 },
  { level: 3, name: "Confirmé", minXp: 1_500 },
  { level: 4, name: "Challenger", minXp: 3_000 },
  { level: 5, name: "Expert", minXp: 5_000 },
  { level: 6, name: "Master", minXp: 10_000 },
  { level: 7, name: "Élite", minXp: 20_000 },
  { level: 8, name: "Légende", minXp: 50_000 },
];

export type LevelProgress = {
  current: LevelDef;
  next: LevelDef | null;
  totalXp: number;
  /** XP still needed to reach the next level (0 at max level). */
  xpRemaining: number;
  /** Progress between current and next level, 0–100 (100 at max level). */
  percent: number;
};

export function getLevelProgress(totalXp: number, levels: readonly LevelDef[] = LEVELS): LevelProgress {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  const sorted = [...levels].sort((a, b) => a.minXp - b.minXp);
  let index = 0;
  for (let i = 0; i < sorted.length; i++) if (xp >= sorted[i]!.minXp) index = i;
  const current = sorted[index]!;
  const next = sorted[index + 1] ?? null;
  if (!next) return { current, next, totalXp: xp, xpRemaining: 0, percent: 100 };
  const span = next.minXp - current.minXp;
  return {
    current,
    next,
    totalXp: xp,
    xpRemaining: next.minXp - xp,
    percent: Math.floor(((xp - current.minXp) / span) * 100),
  };
}

/** True when going from `before` to `after` XP crosses at least one level. */
export function didLevelUp(before: number, after: number): boolean {
  return getLevelProgress(after).current.level > getLevelProgress(before).current.level;
}
