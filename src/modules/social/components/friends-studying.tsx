"use client";

import { BookOpen } from "lucide-react";
import { clockOffsetMs, elapsedSeconds } from "@/modules/focus/domain/elapsed";
import { formatMinutes } from "@/modules/focus/domain/format";
import { useNow } from "@/modules/focus/components/use-now";
import type { LiveFriend } from "../contracts";
import { userLabel } from "../domain/names";
import { UserAvatar } from "./user-avatar";

/** Friends currently in a shared Focus session. Compact, works on mobile. */
export function FriendsStudying({ friends }: { friends: LiveFriend[] }) {
  const now = useNow();

  if (friends.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <BookOpen className="size-4" aria-hidden /> Aucun ami ne révise en ce moment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {friends.length} ami{friends.length > 1 ? "s révisent" : " révise"} en ce moment
      </p>
      <ul className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
        {friends.map((f) => {
          const seconds = now === null ? null : elapsedSeconds(f, now + clockOffsetMs(f.serverNow, now));
          return (
            <li key={f.sessionId} className="flex min-w-56 items-center gap-3 rounded-lg border px-3 py-2">
              <UserAvatar user={f.user} live={f.status === "running"} className="size-9" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{userLabel(f.user)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.subjectName ?? "Révision"} · {seconds === null ? "…" : formatMinutes(seconds / 60)}
                  {f.status === "paused" && " (pause)"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
