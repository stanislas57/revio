import { Flame } from "lucide-react";
import { LinkCard } from "@/components/revio/link-card";
import { OrganicCard } from "@/components/revio/organic-card";
import type { LevelProgress, StreakSummary } from "../contracts";

const nf = new Intl.NumberFormat("fr-FR");

/** Home: level, total XP and progress (Revio Purple organic card, Electric Lime bar). Links to the levels. */
export function HomeLevelCard({ level }: { level: LevelProgress }) {
  const percent = Math.floor(level.progress * 100);
  return (
    <LinkCard href="/profil#niveaux" label="Voir tous les niveaux" className="h-full">
      <OrganicCard tone="primary" className="h-full justify-center">
        <h2 className="text-sm font-bold tracking-wide uppercase">
          Niveau {level.current.number} · {level.current.name}
        </h2>
        <p className="font-heading text-4xl font-extrabold tabular-nums">{nf.format(level.totalXp)} XP</p>
        <div
          role="progressbar"
          aria-label={level.next ? `Progression vers ${level.next.name}` : "Niveau maximum"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-3 w-full max-w-sm overflow-hidden rounded-pill bg-white/30"
        >
          <div className="h-full rounded-pill bg-revio-lime" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm">
          {level.next && level.xpUntilNextLevel !== null
            ? `Encore ${nf.format(level.xpUntilNextLevel)} XP pour atteindre ${level.next.name}.`
            : "Niveau maximum atteint."}
        </p>
      </OrganicCard>
    </LinkCard>
  );
}

/** Home: current streak and record, with the halo (the streak is what we want to keep alive). */
export function HomeStreakCard({ streak }: { streak: StreakSummary }) {
  const days = streak.currentDays;
  return (
    <LinkCard href="/profil" label="Voir ma série" className="h-full">
      <OrganicCard halo className="h-full justify-center">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-2xl bg-revio-streak text-revio-midnight"
        >
          <Flame className="size-7" />
        </span>
        <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Série</h2>
        <p className="font-heading text-4xl font-extrabold tabular-nums">
          {days} jour{days > 1 ? "s" : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {streak.todayValidated ? "Aujourd'hui est validé." : "Révise 10 min pour valider aujourd'hui."}{" "}
          Record : {streak.recordDays} jour{streak.recordDays > 1 ? "s" : ""}.
        </p>
      </OrganicCard>
    </LinkCard>
  );
}
