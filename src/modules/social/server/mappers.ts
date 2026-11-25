import type { PublicUser } from "@/lib/contracts";
import { levelProgress } from "@/modules/gamification/domain/levels";
import { effectiveStreakDays } from "@/modules/gamification/domain/streak-display";
import type { Friend } from "../contracts";
import type { ProfileRow } from "../schemas";

export function toPublicUser(p: ProfileRow): PublicUser {
  return { id: p.id, username: p.username, displayName: p.display_name, avatarUrl: p.avatar_url };
}

type Stats = { total_xp: number; current_streak: number; last_validated_on: string | null };

export function toFriend(args: {
  friendshipId: string;
  since: string;
  profile: ProfileRow;
  stats: Stats | undefined;
  studyingNow: boolean;
  today: string;
}): Friend {
  const { current } = levelProgress(args.stats?.total_xp ?? 0);
  return {
    friendshipId: args.friendshipId,
    user: toPublicUser(args.profile),
    since: args.since,
    level: { number: current.number, name: current.name },
    streakDays: args.stats
      ? effectiveStreakDays(args.stats.current_streak, args.stats.last_validated_on, args.today)
      : 0,
    studyingNow: args.studyingNow,
  };
}
