import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StreakSummary } from "../contracts";
import { lastDays, today as todayInParis } from "../domain/streak-display";
import { XP_RULES } from "../domain/xp";

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Streak, record, next milestone and a 4-week regularity grid. */
export function StreakCard({
  streak,
  days = [],
  today = todayInParis(),
}: {
  streak: StreakSummary;
  /** Minutes per day (Paris), any order. */
  days?: { date: string; minutes: number }[];
  today?: string;
}) {
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const { currentDays, recordDays, nextMilestone } = streak;
  const bonus = nextMilestone ? XP_RULES.streakBonuses[nextMilestone] : undefined;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame
            className={cn("size-4", currentDays > 0 ? "text-orange-500" : "text-muted-foreground")}
            aria-hidden
          />
          Série
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tabular-nums">
          {currentDays}{" "}
          <span className="text-base font-medium text-muted-foreground">
            jour{currentDays > 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Record : {recordDays} jour{recordDays > 1 ? "s" : ""}
          {nextMilestone !== null &&
            ` · Prochain palier : ${nextMilestone} jours (encore ${nextMilestone - currentDays})${bonus ? `, +${bonus} XP` : ""}`}
        </p>
        <ul className="grid grid-cols-7 gap-1.5" aria-label="Régularité des 28 derniers jours">
          {lastDays(today, 28).map((date) => {
            const minutes = byDate.get(date) ?? 0;
            const valid = minutes >= XP_RULES.streakDayMinutes;
            const label = `${dayFmt.format(new Date(`${date}T00:00:00Z`))} : ${minutes} min${valid ? ", jour validé" : ""}`;
            return (
              <li
                key={date}
                title={label}
                aria-label={label}
                className={cn(
                  "aspect-square rounded-sm",
                  valid
                    ? minutes >= 60
                      ? "bg-orange-500"
                      : "bg-orange-400/70"
                    : minutes > 0
                      ? "bg-orange-300/30"
                      : "bg-muted",
                )}
              />
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Un jour compte dès {XP_RULES.streakDayMinutes} min de révision terminées. Un jour de repos
          n&apos;efface pas ton record.
        </p>
      </CardContent>
    </Card>
  );
}
