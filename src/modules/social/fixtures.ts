/**
 * SAMPLE DATA for building the social UI before the backend exists.
 * Any screen showing these must display <MockBadge />.
 */

import { FIXTURE_NOW, FIXTURE_USERS } from "@/lib/fixtures";
import type {
  FeedPage,
  Friend,
  FriendRequest,
  LiveFriend,
  SocialProfile,
  UserSearchResult,
} from "./contracts";

const { stani, charles, lea } = FIXTURE_USERS;

export const FIXTURE_SEARCH_RESULTS: UserSearchResult[] = [
  { ...charles, relation: "friends", friendshipId: "00000000-0000-4000-8000-0000000000c1" },
  { ...lea, relation: "incoming_pending", friendshipId: "00000000-0000-4000-8000-0000000000c2" },
  {
    id: "00000000-0000-4000-8000-000000000005",
    username: "chloe",
    displayName: "Chloé",
    avatarUrl: null,
    relation: "none",
    friendshipId: null,
  },
];

export const FIXTURE_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "00000000-0000-4000-8000-0000000000c2",
    direction: "incoming",
    user: lea,
    createdAt: "2026-11-25T09:12:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000c3",
    direction: "outgoing",
    user: {
      id: "00000000-0000-4000-8000-000000000006",
      username: "tom",
      displayName: "Tom",
      avatarUrl: null,
    },
    createdAt: "2026-11-24T20:00:00Z",
  },
];

export const FIXTURE_FRIENDS: Friend[] = [
  {
    friendshipId: "00000000-0000-4000-8000-0000000000c1",
    user: charles,
    since: "2026-11-01T10:00:00Z",
    level: { number: 5, name: "Expert" },
    streakDays: 32,
    studyingNow: true,
  },
];

export const FIXTURE_SOCIAL_PROFILE: SocialProfile = {
  ...stani,
  relation: "self",
  level: { number: 4, name: "Challenger" },
  totalXp: 4280,
  streak: { currentDays: 15, recordDays: 24 },
  totalStudyMinutes: 2880,
  friendsCount: 24,
};

export const FIXTURE_FEED: FeedPage = {
  posts: [
    {
      id: "00000000-0000-4000-8000-0000000000d1",
      type: "study_session_completed",
      author: stani,
      isMine: true,
      createdAt: FIXTURE_NOW,
      subjectName: "Statistiques",
      durationMinutes: 45,
      earnedXp: 95,
      streakDays: 15,
      reactionsCount: 8,
      hasReacted: false,
    },
    {
      id: "00000000-0000-4000-8000-0000000000d2",
      type: "study_session_completed",
      author: charles,
      isMine: false,
      createdAt: "2026-11-25T15:05:00Z",
      subjectName: null,
      durationMinutes: 90,
      earnedXp: 140,
      streakDays: 32,
      reactionsCount: 2,
      hasReacted: true,
    },
  ],
  nextCursor: null,
};

export const FIXTURE_LIVE_FRIENDS: LiveFriend[] = [
  {
    user: charles,
    sessionId: "00000000-0000-4000-8000-0000000000b9",
    status: "running",
    startedAt: "2026-11-25T17:05:00Z",
    pausedAt: null,
    pausedSeconds: 0,
    subjectName: null,
    serverNow: FIXTURE_NOW,
  },
];
