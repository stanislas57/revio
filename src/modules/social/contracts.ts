/** Social contracts (see API_CONTRACTS.md, section 4). Types only. Never any grade here. */

import type { IsoDateTime, PublicUser, Uuid } from "@/lib/contracts";

export type Relation = "self" | "none" | "outgoing_pending" | "incoming_pending" | "friends";

export type UserSearchResult = PublicUser & { relation: Relation; friendshipId: Uuid | null };

export type FriendRequest = {
  /** friendshipId */
  id: Uuid;
  direction: "incoming" | "outgoing";
  /** The other person. */
  user: PublicUser;
  createdAt: IsoDateTime;
};

export type LevelBadge = { number: number; name: string };

export type Friend = {
  friendshipId: Uuid;
  user: PublicUser;
  since: IsoDateTime;
  level: LevelBadge;
  streakDays: number;
  studyingNow: boolean;
};

export type SocialProfile = PublicUser & {
  relation: Relation;
  /** Game data is visible only to the user and their friends (zeros otherwise). */
  level: LevelBadge;
  totalXp: number;
  streak: { currentDays: number; recordDays: number };
  totalStudyMinutes: number;
  friendsCount: number;
};

export type PostType = "study_session_completed";

export type FeedPost = {
  id: Uuid;
  type: PostType;
  author: PublicUser;
  isMine: boolean;
  createdAt: IsoDateTime;
  /** null when the author does not share the subject. */
  subjectName: string | null;
  durationMinutes: number;
  earnedXp: number;
  streakDays: number;
  reactionsCount: number;
  hasReacted: boolean;
};

export type FeedPage = { posts: FeedPost[]; nextCursor: string | null };

export type ReactionState = { reactionsCount: number; hasReacted: boolean };

export type LiveFriend = {
  user: PublicUser;
  sessionId: Uuid;
  status: "running" | "paused";
  startedAt: IsoDateTime;
  pausedAt: IsoDateTime | null;
  pausedSeconds: number;
  subjectName: string | null;
  serverNow: IsoDateTime;
};

/** Internal notification (S-21). Never carries a grade, a subject or a duration. */
export type NotificationKind = "friend_request" | "friend_accepted" | "post_reaction";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  actor: PublicUser;
  createdAt: string;
  read: boolean;
};

export type NotificationPrefs = {
  friendRequests: boolean;
  friendAccepted: boolean;
  reactions: boolean;
};
