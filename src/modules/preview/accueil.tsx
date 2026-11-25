"use client";

import { useState } from "react";
import { BuddyBeam } from "@/components/revio/buddy-beam";
import { KudosButton } from "@/components/revio/kudos-button";
import { LeagueTable } from "@/components/revio/league-table";
import { LiveActivityFeed } from "@/components/revio/live-activity-feed";
import { PresenceRow } from "@/components/revio/avatar-presence";
import { QuestList } from "@/components/revio/quest-list";
import { RevioRing } from "@/components/revio/revio-ring";
import { SharedSheetCard } from "@/components/revio/shared-sheet-card";
import { RevioStreakCard } from "@/components/revio/streak-card";
import type { Quest } from "@/components/revio/logic";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  DEMO_LEAGUE,
  DEMO_LIVE,
  DEMO_PRESENCE,
  DEMO_QUESTS,
  DEMO_SHEET,
  DEMO_WEEK,
} from "@/lib/mock/revio-demo";
import { PreviewBanner } from "./shared";

/** Mock-up of the revision home (Web-01-Accueil and Fusion-01-Accueil). */
export function PreviewAccueil() {
  const [quests, setQuests] = useState<Quest[]>(DEMO_QUESTS);
  const [kudos, setKudos] = useState(false);
  return (
    <>
      <PageHeader
        title="Aperçu : accueil de révision"
        description="Mercredi 25 novembre · J-12 avant le contrôle de SVT"
      />
      <PreviewBanner>
        Fiches, quêtes, binôme, ligue et salles d&apos;étude n&apos;existent pas encore dans Revio.
      </PreviewBanner>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <PresenceRow friends={DEMO_PRESENCE} total={6} />
          </div>
          <section
            aria-labelledby="revision-title"
            className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-5"
          >
            <RevioRing
              variant="progress"
              label="Avancement du chapitre"
              value={0.64}
              gainValue={0.08}
              size={140}
              stroke={12}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs font-semibold tracking-wide text-revio-magenta-text uppercase">
                Révision du jour
              </p>
              <h2 id="revision-title" className="font-heading text-2xl font-bold">
                Chimie · Les réactions acido-basiques
              </h2>
              <p className="text-sm text-muted-foreground">
                Il reste 14 cartes, environ 12 minutes. Sarah révise le même chapitre en ce moment.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button disabled className="min-h-11 rounded-pill px-5">
                  Reprendre
                </Button>
                <Button disabled variant="outline" className="min-h-11 rounded-pill px-5">
                  Défier Sarah
                </Button>
              </div>
            </div>
          </section>
          <QuestList
            quests={quests}
            onToggle={(id) =>
              setQuests((qs) =>
                qs.map((q) => (q.id === id ? { ...q, current: q.current >= q.target ? 0 : q.target } : q)),
              )
            }
          />
          <section aria-labelledby="fil-title" className="space-y-3">
            <h2 id="fil-title" className="font-heading text-lg font-semibold">
              Fil de tes amis
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SharedSheetCard sheet={DEMO_SHEET} />
              <div className="flex flex-col justify-between gap-4 rounded-lg bg-revio-ink p-5 text-white">
                <div>
                  <p className="text-sm font-semibold">Léo · 23 jours de série</p>
                  <p className="text-xs text-revio-muted-on-ink">Nouveau record perso · à l&apos;instant</p>
                  <p className="mt-3 font-heading text-xl font-bold">Envoie-lui un kudos pour fêter ça.</p>
                </div>
                <div>
                  <KudosButton friendName="Léo" sent={kudos} onSend={() => setKudos(true)} />
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <RevioStreakCard days={17} record={23} jokers={1} weekDays={DEMO_WEEK} />
          <BuddyBeam
            me={{ name: "Inès", initials: "IN" }}
            buddy={{ name: "Sarah", initials: "SA" }}
            days={9}
            status="Sarah révise en ce moment. Toi, c'est déjà fait aujourd'hui."
          />
          <LeagueTable title="Ligue Bronze" endsIn="Fin dans 2 j" rows={DEMO_LEAGUE} />
          <LiveActivityFeed items={DEMO_LIVE} />
        </div>
      </div>
    </>
  );
}
