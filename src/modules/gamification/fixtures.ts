/**
 * SAMPLE DATA for building UI before the backend exists.
 * Any screen showing these must display <MockBadge /> (src/components/states/not-implemented.tsx).
 */

import type { LeaderboardEntry, StreakSummary, Achievement } from "./contracts";
import { levelProgress } from "./domain/levels";
import { FIXTURE_USERS } from "@/lib/fixtures";

export const FIXTURE_LEVEL = levelProgress(4280);
export const FIXTURE_LEVEL_START = levelProgress(0);
export const FIXTURE_LEVEL_MAX = levelProgress(52000);

export const FIXTURE_STREAK: StreakSummary = {
  currentDays: 15,
  recordDays: 24,
  todayValidated: true,
  todayMinutes: 45,
  dailyGoalMinutes: 30,
  dailyGoalCompleted: true,
  nextMilestone: 21,
  lastValidatedOn: "2026-11-25",
};

export const FIXTURE_STREAK_EMPTY: StreakSummary = {
  currentDays: 0,
  recordDays: 0,
  todayValidated: false,
  todayMinutes: 0,
  dailyGoalMinutes: 30,
  dailyGoalCompleted: false,
  nextMilestone: 3,
  lastValidatedOn: null,
};

export const FIXTURE_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    name: "Premier pas",
    description: "Terminer une première séance.",
    category: "volume",
    unlockedAt: "2026-11-10T18:00:00Z",
    progress: null,
  },
  {
    id: "streak_7",
    name: "Régulier",
    description: "Atteindre un streak de 7 jours.",
    category: "regularity",
    unlockedAt: null,
    progress: { current: 5, target: 7 },
  },
];

export const FIXTURE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: FIXTURE_USERS.charles, weeklyXp: 640, isMe: false },
  { rank: 2, user: FIXTURE_USERS.stani, weeklyXp: 515, isMe: true },
  { rank: 3, user: FIXTURE_USERS.lea, weeklyXp: 210, isMe: false },
];
