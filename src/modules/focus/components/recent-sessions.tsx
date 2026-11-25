import Link from "next/link";
import { formatMinutes } from "../domain/format";
import type { RecentSession } from "../server/queries";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function RecentSessions({ sessions }: { sessions: RecentSession[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link
            href={`/focus/seance/${s.id}`}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{s.subjectName ?? "Révision"}</span>
              <span className="text-xs text-muted-foreground">{dateFmt.format(new Date(s.endedAt))}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">{formatMinutes(s.durationMinutes)}</span>
            <span className="w-16 text-right font-medium tabular-nums">+{s.earnedXp} XP</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
