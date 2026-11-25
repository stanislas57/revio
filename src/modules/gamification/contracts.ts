/** Gamification contracts (see API_CONTRACTS.md, section 1). Types only. */

import type { IsoDate, IsoDateTime, PublicUser } from "@/lib/contracts";

export type LevelInfo = { number: number; name: string; minXp: number };

export type LevelProgress = {
  totalXp: number;
  current: LevelInfo;
  /** null at the last level. */
  next: LevelInfo | null;
  /** totalXp - current.minXp */
  xpIntoLevel: number;
  /** null at the last level. */
  xpUntilNextLevel: number | null;
  /** 0..1, 1 at the last level. */
  progress: number;
};

export type StreakSummary = {
  currentDays: number;
  recordDays: number;
  todayValidated: boolean;
  todayMinutes: number;
  dailyGoalMinutes: number;
  dailyGoalCompleted: boolean;
  /** Next milestone (3, 7, 14, 21, 30, 50, 100, 200, 365), null after 365. */
  nextMilestone: number | null;
  lastValidatedOn: IsoDate | null;
};

export type XpReason = "study_duration" | "daily_goal" | "streak_milestone" | "planned_session";

export type XpBreakdownItem = { reason: XpReason; xp: number; label: string };

/** Draft (P1): not implemented server-side yet. */
export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: "regularity" | "volume" | "social" | "level";
  unlockedAt: IsoDateTime | null;
  progress: { current: number; target: number } | null;
};

/** Draft (P1): not implemented server-side yet. */
export type LeaderboardEntry = {
  rank: number;
  user: PublicUser;
  weeklyXp: number;
  isMe: boolean;
};
