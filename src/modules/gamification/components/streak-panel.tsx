import { Flame } from "lucide-react";
import { RevioStreakCard } from "@/components/revio/streak-card";
import type { StreakSummary } from "../contracts";
import { today as todayInParis } from "../domain/streak-display";
import { weekStreakDays } from "../domain/week-streak";
import { XP_RULES } from "../domain/xp";

/**
 * The streak of the user as the Revio ink card: the days of the week, the record, and below the next milestone and
 * the rule. Real data only: the product has no joker, so none is shown.
 */
export function StreakPanel({
  streak,
  days,
  today = todayInParis(),
}: {
  streak: StreakSummary;
  /** Minutes per day (Paris), any order. */
  days: { date: string; minutes: number }[];
  today?: string;
}) {
  const minutesByDate = Object.fromEntries(days.map((d) => [d.date, d.minutes]));
  const { currentDays, recordDays, nextMilestone } = streak;
  const bonus = nextMilestone ? XP_RULES.streakBonuses[nextMilestone] : undefined;
  return (
    <div className="space-y-3">
      <RevioStreakCard
        days={currentDays}
        record={recordDays}
        weekDays={weekStreakDays(today, minutesByDate, XP_RULES.streakDayMinutes)}
      />
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Flame className="mt-0.5 size-4 shrink-0 text-revio-magenta-text" aria-hidden />
        <span>
          {nextMilestone !== null
            ? `Prochain palier : ${nextMilestone} jours (encore ${nextMilestone - currentDays})${bonus ? `, +${bonus} XP` : ""}. `
            : ""}
          Un jour compte dès {XP_RULES.streakDayMinutes} min de révision terminées. Un jour de repos
          n&apos;efface pas ton record.
        </span>
      </p>
    </div>
  );
}
