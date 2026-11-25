"use client";

import { BookOpen } from "lucide-react";
import { elapsedSeconds } from "@/modules/focus/domain/time";
import { formatMinutes } from "@/modules/focus/domain/time";
import { useNow } from "@/modules/focus/components/use-now";
import { displayName } from "../domain/names";
import type { FriendOverview } from "../schemas";
import { UserAvatar } from "./user-avatar";

/** Friends currently in a shared Focus session. Compact, works on mobile. */
export function FriendsStudying({ friends }: { friends: FriendOverview[] }) {
  const now = useNow();
  const live = friends.filter((f) => f.live_started_at);

  if (live.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <BookOpen className="size-4" aria-hidden /> Aucun ami ne révise en ce moment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {live.length} ami{live.length > 1 ? "s révisent" : " révise"} en ce moment
      </p>
      <ul className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
        {live.map((f) => {
          const seconds =
            now === null
              ? null
              : elapsedSeconds(
                  {
                    startedAt: f.live_started_at!,
                    pausedSeconds: f.live_paused_seconds ?? 0,
                    pausedAt: f.live_paused_at,
                  },
                  now,
                );
          return (
            <li key={f.user_id} className="flex min-w-56 items-center gap-3 rounded-lg border px-3 py-2">
              <UserAvatar profile={f} live={!f.live_paused_at} className="size-9" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName(f)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.live_label ?? "Révision"} · {seconds === null ? "…" : formatMinutes(seconds / 60)}
                  {f.live_paused_at && " (pause)"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
