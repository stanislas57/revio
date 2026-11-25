import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { gapToNext, myEntry, rankLabel } from "../../domain/leaderboard";
import { userLabel } from "../../domain/names";

const nf = new Intl.NumberFormat("fr-FR");

/** Where I stand and what is missing to pass the person above. */
export function MyPosition({
  entries,
  periodLabel,
}: {
  entries: readonly LeaderboardEntry[];
  periodLabel: string;
}) {
  const me = myEntry(entries);
  if (!me) return null;
  const gap = gapToNext(entries);
  return (
    <section
      aria-labelledby="my-position-title"
      className="rounded-xl border border-brand/50 bg-brand-soft p-4 text-brand-soft-foreground"
    >
      <h2 id="my-position-title" className="flex items-center gap-2 text-sm font-semibold">
        <Trophy className="size-4" aria-hidden /> Ta position
      </h2>
      <p className="mt-1 text-2xl font-bold">
        {rankLabel(me.rank)} <span className="text-base font-medium">sur {entries.length}</span>
      </p>
      <p className="text-sm">
        {nf.format(me.weeklyXp)} XP · {periodLabel.toLowerCase()}
      </p>
      <p className="mt-2 text-sm font-medium">
        {gap
          ? `Encore ${nf.format(gap.xp)} XP pour dépasser ${userLabel(gap.entry.user)}.`
          : "Tu es en tête du classement. Bravo !"}
      </p>
    </section>
  );
}
