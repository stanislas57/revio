/**
 * SAMPLE DATA for the social profile page: the user's own profile (from `fixtures.ts`), a friend,
 * a pending request and a stranger, plus shared sessions. One post carries a subject on purpose,
 * to prove a profile never shows it. Any screen showing these must display <MockBadge />.
 */

import { FIXTURE_NOW, FIXTURE_USERS } from "@/lib/fixtures";
import type { FeedPost, SocialProfile } from "./contracts";
import { FIXTURE_FEED, FIXTURE_SOCIAL_PROFILE } from "./fixtures";

const { charles, lea } = FIXTURE_USERS;
const chloe = {
  id: "00000000-0000-4000-8000-000000000005",
  username: "chloe",
  displayName: "Chloé",
  avatarUrl: null,
};

export const FIXTURE_PROFILE_SELF: SocialProfile = FIXTURE_SOCIAL_PROFILE;

export const FIXTURE_PROFILE_FRIEND: SocialProfile = {
  ...charles,
  relation: "friends",
  level: { number: 5, name: "Expert" },
  totalXp: 5230,
  streak: { currentDays: 32, recordDays: 32 },
  totalStudyMinutes: 5100,
  friendsCount: 12,
};

export const FIXTURE_PROFILE_PENDING: SocialProfile = {
  ...lea,
  relation: "incoming_pending",
  // The server answers zeros for someone who is not a friend: the screen must not show them as real.
  level: { number: 1, name: "Novice" },
  totalXp: 0,
  streak: { currentDays: 0, recordDays: 0 },
  totalStudyMinutes: 0,
  friendsCount: 0,
};

export const FIXTURE_PROFILE_STRANGER: SocialProfile = {
  ...chloe,
  relation: "none",
  level: { number: 1, name: "Novice" },
  totalXp: 0,
  streak: { currentDays: 0, recordDays: 0 },
  totalStudyMinutes: 0,
  friendsCount: 0,
};

export const FIXTURE_PROFILES: SocialProfile[] = [
  FIXTURE_PROFILE_SELF,
  FIXTURE_PROFILE_FRIEND,
  FIXTURE_PROFILE_PENDING,
  FIXTURE_PROFILE_STRANGER,
];

const post = (
  id: string,
  createdAt: string,
  minutes: number,
  xp: number,
  streak: number,
  subject: string | null,
): FeedPost => ({
  id,
  type: "study_session_completed",
  author: charles,
  isMine: false,
  createdAt,
  subjectName: subject,
  durationMinutes: minutes,
  earnedXp: xp,
  streakDays: streak,
  reactionsCount: 0,
  hasReacted: false,
});

/** Shared sessions of the sample users. The friend's first one shares its subject: it must never be displayed. */
export const FIXTURE_SHARED_POSTS: FeedPost[] = [
  ...FIXTURE_FEED.posts,
  post("00000000-0000-4000-8000-0000000000e1", "2026-11-24T18:20:00Z", 60, 110, 31, "Droit du travail"),
  post("00000000-0000-4000-8000-0000000000e2", "2026-11-23T09:00:00Z", 35, 35, 30, null),
  post("00000000-0000-4000-8000-0000000000e3", "2026-11-21T14:30:00Z", 120, 300, 28, "Finance"),
];

export { FIXTURE_NOW };
