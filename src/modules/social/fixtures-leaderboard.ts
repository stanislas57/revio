/**
 * SAMPLE DATA for the weekly leaderboard: the three entries of `gamification/fixtures.ts` plus
 * three invented friends, so the podium and the list below it can both be seen.
 * Any screen showing these must display <MockBadge />. XP only: no grade, ever.
 */

import { FIXTURE_USERS } from "@/lib/fixtures";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { FIXTURE_LEADERBOARD } from "@/modules/gamification/fixtures";

const extra = [
  { id: "00000000-0000-4000-8000-000000000011", username: "hugo_b", displayName: "Hugo", avatarUrl: null },
  { id: "00000000-0000-4000-8000-000000000012", username: "ines", displayName: "Inès", avatarUrl: null },
  { id: "00000000-0000-4000-8000-000000000013", username: "paul_d", displayName: "Paul", avatarUrl: null },
] as const;

export const FIXTURE_LEADERBOARD_WEEK: LeaderboardEntry[] = [
  ...FIXTURE_LEADERBOARD,
  { rank: 4, user: extra[0], weeklyXp: 180, isMe: false },
  { rank: 5, user: extra[1], weeklyXp: 95, isMe: false },
  { rank: 6, user: extra[2], weeklyXp: 40, isMe: false },
];

/** The same board seen by someone ranked below the podium. */
export const FIXTURE_LEADERBOARD_WEEK_FROM_FOURTH: LeaderboardEntry[] = FIXTURE_LEADERBOARD_WEEK.map((e) => ({
  ...e,
  isMe: e.user.id === extra[0].id,
}));

export { FIXTURE_USERS };
