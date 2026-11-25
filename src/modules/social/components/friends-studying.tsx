"use client";

import { BookOpen } from "lucide-react";
import { AvatarPresence } from "@/components/revio/avatar-presence";
import { clockOffsetMs, elapsedSeconds } from "@/modules/focus/domain/elapsed";
import { useNow } from "@/modules/focus/components/use-now";
import type { LiveFriend } from "../contracts";
import { userLabel } from "../domain/names";

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
      <ul className="flex flex-wrap gap-x-5 gap-y-3 pb-1">
        {friends.map((f) => {
          const seconds = now === null ? null : elapsedSeconds(f, now + clockOffsetMs(f.serverNow, now));
          const minutes = seconds === null ? 0 : Math.floor(seconds / 60);
          const name = userLabel(f.user);
          const subject = `${f.subjectName ?? "Révision"}${f.status === "paused" ? " (pause)" : ""}`;
          return (
            <li key={f.sessionId} className="min-w-56 rounded-lg border px-3 py-2">
              {/* One turn of the ring is one hour of study. The subject is only written when the friend shares it. */}
              <AvatarPresence
                friend={{
                  id: f.sessionId,
                  name,
                  initials: name.replace(/^@/, "").slice(0, 2).toUpperCase(),
                  subject,
                  minutes,
                  value: Math.min(1, minutes / 60),
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
