/**
 * What a social profile shows, depending on who looks at it (pure).
 * Game data (level, XP, streak, time, shared sessions) is visible to the user and to their
 * friends only. A grade, an average or a subject is never part of a social profile: shared
 * sessions are reduced to a shape that cannot even carry a subject.
 */

import type { IsoDateTime, Uuid } from "@/lib/contracts";
import type { FeedPost, Relation } from "../contracts";

/** self: my own profile as my friends see it · friend: a friend's · limited: someone who is not a friend. */
export type ProfileVisibility = "self" | "friend" | "limited";

export function profileVisibility(relation: Relation): ProfileVisibility {
  if (relation === "self") return "self";
  if (relation === "friends") return "friend";
  return "limited";
}

export function canSeeGameData(relation: Relation): boolean {
  return profileVisibility(relation) !== "limited";
}

export function relationLabel(relation: Relation): string {
  return {
    self: "C'est toi",
    friends: "Ami",
    incoming_pending: "T'a envoyé une demande",
    outgoing_pending: "Demande envoyée",
    none: "Pas encore amis",
  }[relation];
}

/** A shared session as a profile shows it: when, how long, what it earned. No subject, on purpose. */
export type SharedSession = {
  id: Uuid;
  createdAt: IsoDateTime;
  durationMinutes: number;
  earnedXp: number;
  streakDays: number;
};

/**
 * The latest shared sessions of `userId`, newest first. The subject of a post (when its author
 * shares it in the feed) is dropped here: a profile never shows subjects.
 */
export function sharedSessionsOf(posts: readonly FeedPost[], userId: Uuid, limit = 5): SharedSession[] {
  return posts
    .filter((p) => p.author.id === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, Math.max(0, limit))
    .map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      durationMinutes: p.durationMinutes,
      earnedXp: p.earnedXp,
      streakDays: p.streakDays,
    }));
}
