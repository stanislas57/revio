import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { userLabel } from "../../domain/names";
import { UserAvatar } from "../user-avatar";

const nf = new Intl.NumberFormat("fr-FR");

/** Everyone after the podium. "Toi" is written, so the row does not rely on its color. */
export function RankingList({ entries }: { entries: readonly LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol start={entries[0]?.rank} aria-label="Suite du classement" className="divide-y rounded-xl border">
      {entries.map((e) => (
        <li
          key={e.user.id}
          className={cn(
            "flex min-h-14 items-center gap-3 px-3 py-2",
            e.isMe && "bg-brand-soft text-brand-soft-foreground",
          )}
        >
          <span
            className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums"
            aria-label={`Place ${e.rank}`}
          >
            {e.rank}
          </span>
          <UserAvatar user={e.user} className="size-9" />
          <span className="min-w-0 flex-1 text-sm font-medium break-words">
            {userLabel(e.user)}
            {e.isMe && <span className="ml-2 text-xs font-semibold">Toi</span>}
          </span>
          <span className="shrink-0 text-sm tabular-nums">{nf.format(e.weeklyXp)} XP</span>
        </li>
      ))}
    </ol>
  );
}
