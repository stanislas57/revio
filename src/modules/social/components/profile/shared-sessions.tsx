import { Clock, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/modules/focus/domain/format";
import type { SharedSession } from "../../domain/profile-view";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** Latest shared sessions: when, how long, what they earned. Never a subject. */
export function SharedSessions({
  sessions,
  emptyText,
}: {
  sessions: readonly SharedSession[];
  emptyText: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-xl border">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <time
            dateTime={s.createdAt}
            className="text-sm font-medium first-letter:uppercase sm:min-w-0 sm:flex-1"
          >
            {dateFmt.format(new Date(s.createdAt))}
          </time>
          <span className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Clock aria-hidden /> {formatMinutes(s.durationMinutes)}
            </Badge>
            <Badge variant="secondary" className="text-brand-text">
              <Sparkles aria-hidden /> +{s.earnedXp} XP
            </Badge>
            {s.streakDays > 1 && (
              <Badge variant="secondary">
                <Flame aria-hidden /> série {s.streakDays} j
              </Badge>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
