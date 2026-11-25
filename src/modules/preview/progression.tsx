"use client";

import { Clock, Flame } from "lucide-react";
import { BadgeCard } from "@/components/revio/badge-card";
import { LeagueTable } from "@/components/revio/league-table";
import { RevioRing } from "@/components/revio/revio-ring";
import { RevioStreakCard } from "@/components/revio/streak-card";
import { XpBar } from "@/components/revio/xp-bar";
import { PageHeader } from "@/components/layout/page-header";
import { DEMO_BADGES, DEMO_LEAGUE, DEMO_ME, DEMO_WEEK } from "@/lib/mock/revio-demo";
import { PreviewBanner } from "./shared";

/** Mock-up of the progression (Fusion-04): level, "Ta semaine", streak, badges, league. */
export function PreviewProgression() {
  return (
    <>
      <PageHeader title="Aperçu : progression" description="Niveau, série, badges et ligue." />
      <PreviewBanner>
        La story de la semaine, les jokers, les raretés de badges et la ligue n&apos;existent pas encore dans
        Revio.
      </PreviewBanner>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section aria-label="Niveau" className="flex items-center gap-5 rounded-xl border bg-card p-5">
            <RevioRing
              variant="progress"
              label="Progression vers le niveau 13"
              value={DEMO_ME.xp / DEMO_ME.xpMax}
              gainValue={0.03}
              size={96}
              stroke={9}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-heading text-xl font-bold">Inès · Niveau 12</p>
              <p className="text-sm text-muted-foreground">1 240 / 1 500 XP · Révisionnaire confirmée</p>
              <XpBar level={12} xp={DEMO_ME.xp} xpMax={DEMO_ME.xpMax} gain={40} />
            </div>
          </section>
          <section aria-labelledby="week-title" className="rounded-xl bg-revio-ink p-5 text-white">
            <h2 id="week-title" className="font-heading text-xl font-bold">
              Ta semaine est prête
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-revio-muted-on-ink">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden /> 6 h 40 révisées
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-4" aria-hidden /> 12 kudos reçus
              </span>
            </p>
          </section>
          <RevioStreakCard days={17} record={23} jokers={1} weekDays={DEMO_WEEK} />
        </div>
        <div className="space-y-6">
          <section aria-labelledby="badges-title" className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id="badges-title" className="font-heading text-lg font-semibold">
                Badges
              </h2>
              <span className="text-xs text-muted-foreground">Voir les 24</span>
            </div>
            <ul className="grid grid-cols-2 gap-4">
              {DEMO_BADGES.map((b) => (
                <li key={b.name}>
                  <BadgeCard name={b.name} rarity={b.rarity} Icon={b.Icon} unlocked={b.unlocked} />
                </li>
              ))}
            </ul>
          </section>
          <LeagueTable title="Ligue Bronze" endsIn="Fin dans 2 j" rows={DEMO_LEAGUE} />
        </div>
      </div>
    </>
  );
}
