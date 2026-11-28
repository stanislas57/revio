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
      <p className="flex items-center justify-center gap-2 rounded-3xl border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
        <BookOpen className="size-4" aria-hidden /> Aucun ami ne révise en ce moment.
      </p>
    );
  }

  return (
    <section
      className="space-y-3 rounded-3xl border bg-card p-4 text-left"
      aria-label="En révision maintenant"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">En révision maintenant</h2>
        <p className="rounded-pill bg-revio-social/15 px-3 py-1 text-xs font-bold text-revio-social-text">
          {friends.length} ami{friends.length > 1 ? "s révisent" : " révise"} en ce moment
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {friends.map((f) => {
          const seconds = now === null ? null : elapsedSeconds(f, now + clockOffsetMs(f.serverNow, now));
          const minutes = seconds === null ? 0 : Math.floor(seconds / 60);
          const name = userLabel(f.user);
          const subject = `${f.subjectName ?? "Révision"}${f.status === "paused" ? " (pause)" : ""}`;
          return (
            <li key={f.sessionId} className="rounded-2xl bg-brand-soft/70 px-3 py-2">
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
    </section>
  );
}
