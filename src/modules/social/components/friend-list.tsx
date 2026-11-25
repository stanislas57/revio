import { Flame, Sparkles } from "lucide-react";
import { getLevelProgress } from "@/modules/gamification/domain/levels";
import { displayName } from "../domain/names";
import type { FriendOverview } from "../schemas";
import { RemoveFriendButton } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

export function FriendList({ friends }: { friends: FriendOverview[] }) {
  const sorted = [...friends].sort((a, b) => displayName(a).localeCompare(displayName(b), "fr"));
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {sorted.map((f) => {
        const level = getLevelProgress(f.total_xp).current;
        const live = !!f.live_started_at;
        return (
          <li key={f.user_id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
            <UserAvatar profile={f} live={live} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName(f)}</p>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="size-3 text-violet-500" aria-hidden /> {level.name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame className="size-3 text-orange-500" aria-hidden /> {f.current_streak} j
                </span>
                <span>
                  {live ? `En révision${f.live_label ? ` · ${f.live_label}` : ""}` : "Pas en séance"}
                </span>
              </p>
            </div>
            <RemoveFriendButton profileId={f.user_id} name={displayName(f)} />
          </li>
        );
      })}
    </ul>
  );
}
