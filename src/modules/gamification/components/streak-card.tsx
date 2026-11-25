import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STREAK_DAY_MIN_MINUTES, nextStreakMilestone } from "../domain/rules";

type Day = { date: string; minutes: number };

function parisToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/** Last `count` calendar days (yyyy-mm-dd, Paris), oldest first. */
function lastDays(count: number): string[] {
  const [y, m, d] = parisToday().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(y!, m! - 1, d! - (count - 1 - i)));
    return date.toISOString().slice(0, 10);
  });
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Streak, record, next milestone and a 4-week regularity grid. */
export function StreakCard({ current, best, days }: { current: number; best: number; days: Day[] }) {
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const next = nextStreakMilestone(current);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame
            className={cn("size-4", current > 0 ? "text-orange-500" : "text-muted-foreground")}
            aria-hidden
          />
          Série
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tabular-nums">
          {current}{" "}
          <span className="text-base font-medium text-muted-foreground">jour{current > 1 ? "s" : ""}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Record : {best} jour{best > 1 ? "s" : ""}
          {next &&
            ` · Prochain palier : ${next.days} jours (encore ${next.remaining})${next.bonusXp ? `, +${next.bonusXp} XP` : ""}`}
        </p>
        <ul className="grid grid-cols-7 gap-1.5" aria-label="Régularité des 28 derniers jours">
          {lastDays(28).map((date) => {
            const minutes = byDate.get(date) ?? 0;
            const valid = minutes >= STREAK_DAY_MIN_MINUTES;
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
          Un jour compte dès {STREAK_DAY_MIN_MINUTES} min de révision terminées. Un jour de repos
          n&apos;efface pas ton record.
        </p>
      </CardContent>
    </Card>
  );
}
