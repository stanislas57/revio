import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { userLabel } from "../../domain/names";

const nf = new Intl.NumberFormat("fr-FR");

/**
 * The top of the week's ranking (XP only), beside the feed: the design's « Ligue », made from what exists, the
 * weekly ranking between friends. "Toi" is written, so the row never relies on its colour alone.
 */
export function LeaderboardCard({
  entries,
  participation,
}: {
  entries: readonly LeaderboardEntry[];
  participation: "in" | "out";
}) {
  const top = entries.slice(0, 4);
  const me = entries.find((e) => e.isMe);
  // The caller is always shown, even outside the top, so the card answers « où j'en suis ? ».
  const rows = me && !top.some((e) => e.isMe) ? [...top.slice(0, 3), me] : top;
  return (
    <section aria-labelledby="board-title" className="space-y-3 rounded-3xl border bg-card p-4 text-left">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="board-title" className="text-xl font-extrabold">
          Classement de la semaine
        </h2>
        <span className="text-xs text-muted-foreground">XP de la semaine</span>
      </div>
      {participation === "out" ? (
        <p className="text-sm text-muted-foreground">
          Tu as quitté le classement. Tu peux y revenir dans la page.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas encore d&apos;XP cette semaine.</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((e) => (
            <li
              key={e.user.id}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm",
                e.isMe ? "bg-revio-deep text-white" : "bg-brand-soft/60",
              )}
            >
              <span
                className="w-5 shrink-0 text-center font-bold tabular-nums"
                aria-label={`Place ${e.rank}`}
              >
                {e.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {userLabel(e.user)}
                {e.isMe && <span className="ml-2 text-xs font-bold">Toi</span>}
              </span>
              <span className="shrink-0 font-bold tabular-nums">{nf.format(e.weeklyXp)} XP</span>
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/social/classement"
        className="flex min-h-11 items-center justify-center gap-1 rounded-full text-sm font-semibold text-brand-text outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        Voir tout le classement <ChevronRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
