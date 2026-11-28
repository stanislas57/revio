import { Flame, Sparkles } from "lucide-react";
import type { Friend } from "../contracts";
import { userLabel } from "../domain/names";
import { RemoveFriendButton } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

export function FriendList({ friends }: { friends: Friend[] }) {
  const sorted = [...friends].sort((a, b) => userLabel(a.user).localeCompare(userLabel(b.user), "fr"));
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {sorted.map((f) => (
        <li key={f.friendshipId} className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-2">
          <UserAvatar user={f.user} live={f.studyingNow} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium break-words">{userLabel(f.user)}</p>
            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3 text-brand-text" aria-hidden /> {f.level.name}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3 text-revio-streak-text" aria-hidden /> {f.streakDays} j
              </span>
              <span>{f.studyingNow ? "En révision" : "Pas en séance"}</span>
            </p>
          </div>
          <RemoveFriendButton friendshipId={f.friendshipId} name={userLabel(f.user)} />
        </li>
      ))}
    </ul>
  );
}
