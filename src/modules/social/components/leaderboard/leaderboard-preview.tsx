"use client";

import { useState } from "react";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { LeaderboardView } from "./leaderboard-view";

/**
 * Sample-data wrapper. With `interactive`, leaving and rejoining only flips a LOCAL display state
 * (nothing is saved anywhere): it lets the leave flow be tried before the server exists.
 * Without it the buttons stay disabled, like in production until S-19.
 */
export function LeaderboardPreview({
  entries,
  now,
  timeZone,
  initialParticipation = "in",
  interactive = false,
}: {
  entries: readonly LeaderboardEntry[];
  now: string;
  timeZone: string;
  initialParticipation?: "in" | "out";
  interactive?: boolean;
}) {
  const [participation, setParticipation] = useState(initialParticipation);
  const local = interactive
    ? {
        onLeave: async () => {
          setParticipation("out");
          return { ok: true as const, data: null };
        },
        onJoin: async () => {
          setParticipation("in");
          return { ok: true as const, data: null };
        },
      }
    : {};
  return (
    <LeaderboardView
      entries={entries}
      now={now}
      timeZone={timeZone}
      participation={participation}
      {...local}
    />
  );
}
