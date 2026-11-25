"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { useNow } from "@/modules/focus/components/use-now";
import {
  PERIODS,
  afterPodium,
  formatTimeLeft,
  formatWeekEnd,
  topThree,
  timeLeft,
  weekEnd,
  type PeriodId,
} from "../../domain/leaderboard";
import { MyPosition } from "./my-position";
import { Participation, type ParticipationHandler } from "./participation";
import { PeriodFilter } from "./period-filter";
import { Podium } from "./podium";
import { RankingList } from "./ranking-list";

/**
 * Friends leaderboard: period filter, time left, podium, my position and the rest. It only shows
 * what it receives (XP and ranks computed by the server) and never any grade.
 */
export function LeaderboardView({
  entries,
  now,
  timeZone,
  availablePeriods = ["week"],
  participation = "in",
  onLeave,
  onJoin,
}: {
  entries: readonly LeaderboardEntry[];
  /** Server time (ISO) used until the page is hydrated. */
  now: string;
  timeZone: string;
  availablePeriods?: readonly PeriodId[];
  participation?: "in" | "out";
  onLeave?: ParticipationHandler;
  onJoin?: ParticipationHandler;
}) {
  const [period, setPeriod] = useState<PeriodId>("week");
  const clock = useNow();
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? "";

  const end = weekEnd(now, timeZone);
  const left = timeLeft(clock !== null ? new Date(clock) : now, end);
  const ranked = participation === "in" && entries.length > 0;

  return (
    <div className="space-y-6">
      <PeriodFilter value={period} available={availablePeriods} onChange={setPeriod} />

      {participation === "in" && period === "week" && (
        <p className="text-sm text-muted-foreground">
          Fin de la semaine dans{" "}
          <time dateTime={end.toISOString()} className="font-semibold text-foreground">
            {formatTimeLeft(left)}
          </time>{" "}
          ({formatWeekEnd(end, timeZone)}).
        </p>
      )}

      {participation === "out" ? null : ranked ? (
        <>
          <Podium entries={topThree(entries)} />
          <MyPosition entries={entries} periodLabel={periodLabel} />
          <RankingList entries={afterPodium(entries)} />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Pas encore de classement"
          description="Ajoute des amis et révise : leurs XP et les tiens apparaîtront ici."
        />
      )}

      <Participation state={participation} onLeave={onLeave} onJoin={onJoin} />
    </div>
  );
}
