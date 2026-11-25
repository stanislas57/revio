"use client";

import { useState, type ReactNode } from "react";
import { Award, BookOpen, Flame } from "lucide-react";
import { AvatarPresence, PresenceRow } from "@/components/revio/avatar-presence";
import { BadgeCard } from "@/components/revio/badge-card";
import { BuddyBeam } from "@/components/revio/buddy-beam";
import { DesktopSidebar } from "@/components/revio/desktop-sidebar";
import { FlashcardStack } from "@/components/revio/flashcard-stack";
import { FocusTimer } from "@/components/revio/focus-timer";
import { KudosButton } from "@/components/revio/kudos-button";
import { LeagueTable } from "@/components/revio/league-table";
import { LiveActivityFeed, type LiveItem } from "@/components/revio/live-activity-feed";
import {
  addXp,
  canSendKudos,
  dayKey,
  placesGained,
  rankLeague,
  recordKudos,
  type KudosLedger,
  type Quest,
  type Verdict,
} from "@/components/revio/logic";
import { MobileDock } from "@/components/revio/mobile-dock";
import { QuestList } from "@/components/revio/quest-list";
import { ReactionBar, type ReactionId } from "@/components/revio/reaction-bar";
import { RevioRing } from "@/components/revio/revio-ring";
import { SharedSheetCard } from "@/components/revio/shared-sheet-card";
import { RevioStreakCard } from "@/components/revio/streak-card";
import { RevioSubjectCard } from "@/components/revio/subject-card";
import { XpBar } from "@/components/revio/xp-bar";
import {
  DEMO_BADGES,
  DEMO_CARDS,
  DEMO_DOCK,
  DEMO_FOCUS,
  DEMO_LEAGUE,
  DEMO_LIVE,
  DEMO_LIVE_NEXT,
  DEMO_ME,
  DEMO_NAV,
  DEMO_PRESENCE,
  DEMO_QUESTS,
  DEMO_SHEET,
  DEMO_SUBJECTS,
  DEMO_WEEK,
} from "@/lib/mock/revio-demo";

function Showcase({
  id,
  title,
  children,
  note,
}: {
  id: string;
  title: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20 space-y-4">
      <div>
        <h2 id={`${id}-heading`} className="font-heading text-2xl font-bold">
          {title}
        </h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="rounded-xl border bg-card p-5">{children}</div>
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6">{children}</div>
);

/** Every component of `components/revio/` in its main states, with sample data. */
export function DesignSystemDemo() {
  const [quests, setQuests] = useState<Quest[]>(DEMO_QUESTS);
  const [ledger, setLedger] = useState<KudosLedger>({});
  const [reaction, setReaction] = useState<ReactionId | null>(null);
  const [live, setLive] = useState<LiveItem[]>(DEMO_LIVE);
  const [league, setLeague] = useState(DEMO_LEAGUE);
  const [gained, setGained] = useState<Record<string, number>>({});
  const [paused, setPaused] = useState(false);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [gain, setGain] = useState(40);
  const today = dayKey();

  const toggleQuest = (id: string) =>
    setQuests((qs) =>
      qs.map((q) => (q.id === id ? { ...q, current: q.current >= q.target ? 0 : q.target } : q)),
    );

  const addLive = () =>
    setLive((items) => {
      const next = DEMO_LIVE_NEXT[items.length % DEMO_LIVE_NEXT.length]!;
      return [...items, { ...next, id: `${next.id}-${items.length}` }];
    });

  const gainXp = () => {
    const before = rankLeague(league);
    const next = addXp(league, "me", 120);
    const after = rankLeague(next);
    setGained((g) => ({ ...g, me: (g.me ?? 0) + placesGained(before, after, "me") }));
    setLeague(next);
  };

  return (
    <div className="space-y-10">
      <Showcase
        id="anneau"
        title="RevioRing"
        note="Le signe central : progression (violet et lime pour le gain récent) et présence (dégradé, point « en direct »)."
      >
        <Row>
          <RevioRing variant="progress" label="Progression du chapitre" value={0.64} gainValue={0.1} />
          <RevioRing variant="progress" label="Progression à 100 %" value={1} size={90} stroke={8} />
          <RevioRing variant="progress" label="Progression à 0 %" value={0} size={90} stroke={8} />
          <RevioRing variant="presence" value={0.7} size={64} stroke={4} live>
            <span className="flex size-full items-center justify-center rounded-full bg-revio-lilac text-sm font-bold text-revio-ink">
              LB
            </span>
          </RevioRing>
        </Row>
      </Showcase>

      <Showcase id="presence" title="AvatarPresence et PresenceRow">
        <div className="space-y-6">
          <PresenceRow friends={DEMO_PRESENCE} total={6} />
          <PresenceRow friends={[]} total={0} />
          <Row>
            <AvatarPresence friend={DEMO_PRESENCE[0]!} compact />
            <AvatarPresence friend={DEMO_PRESENCE[2]!} compact />
          </Row>
        </div>
      </Showcase>

      <Showcase
        id="xp"
        title="XpBar"
        note="Niveau, barre violette, segment lime pour le dernier gain, chiffres qui glissent."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <XpBar level={DEMO_ME.level} xp={DEMO_ME.xp} xpMax={DEMO_ME.xpMax} gain={gain} />
            <button
              type="button"
              className="min-h-11 rounded-pill border px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => setGain((g) => (g === 0 ? 40 : 0))}
            >
              {gain === 0 ? "Afficher un gain de +40 XP" : "Retirer le gain"}
            </button>
          </div>
          <div className="rounded-lg bg-revio-ink p-4">
            <XpBar tone="ink" level={DEMO_ME.level} xp={DEMO_ME.xp} xpMax={DEMO_ME.xpMax} />
          </div>
        </div>
      </Showcase>

      <Showcase id="serie" title="RevioStreakCard">
        <RevioStreakCard days={17} record={23} jokers={1} weekDays={DEMO_WEEK} className="max-w-sm" />
      </Showcase>

      <Showcase
        id="quetes"
        title="QuestList"
        note="Cocher la 3ᵉ quête ouvre le coffre : confettis, une seule fois par jour."
      >
        <QuestList quests={quests} onToggle={toggleQuest} />
      </Showcase>

      <Showcase
        id="kudos"
        title="KudosButton et ReactionBar"
        note="Un kudos par jour et par ami ; aucun compteur public."
      >
        <Row>
          {DEMO_PRESENCE.slice(0, 2).map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <KudosButton
                friendName={f.name}
                sent={!canSendKudos(ledger, f.id, today)}
                onSend={() => setLedger((l) => recordKudos(l, f.id, today))}
              />
            </div>
          ))}
          <ReactionBar value={reaction} onChange={setReaction} />
        </Row>
      </Showcase>

      <Showcase id="fiches" title="SharedSheetCard">
        <SharedSheetCard sheet={DEMO_SHEET} className="max-w-md" />
      </Showcase>

      <Showcase
        id="direct"
        title="LiveActivityFeed"
        note="Trois entrées au plus : les nouvelles arrivent par le bas, les anciennes pâlissent."
      >
        <div className="max-w-md space-y-3">
          <LiveActivityFeed items={live} />
          <button
            type="button"
            onClick={addLive}
            className="min-h-11 rounded-pill border px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Ajouter une activité
          </button>
        </div>
      </Showcase>

      <Showcase
        id="ligue"
        title="LeagueTable"
        note="Une trentaine d'élèves ; ta ligne est violette avec « ▲ N » quand tu montes."
      >
        <div className="max-w-md space-y-3">
          <LeagueTable title="Ligue Bronze" endsIn="Fin dans 2 j" rows={league} gained={gained} />
          <button
            type="button"
            onClick={gainXp}
            className="min-h-11 rounded-pill border px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Gagner 120 XP
          </button>
        </div>
      </Showcase>

      <Showcase id="binome" title="BuddyBeam">
        <div className="max-w-sm">
          <BuddyBeam
            me={{ name: "Inès", initials: "IN" }}
            buddy={{ name: "Sarah", initials: "SA" }}
            days={9}
            status="Sarah révise en ce moment. Toi, c'est déjà fait aujourd'hui."
          />
        </div>
      </Showcase>

      <Showcase
        id="cartes"
        title="FlashcardStack"
        note="Touche pour retourner ; glisse à droite (je sais) ou à gauche (à revoir) ; les deux boutons font la même chose."
      >
        <FlashcardStack cards={DEMO_CARDS} onVerdict={(_, v) => setVerdicts((all) => [...all, v])} />
        <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
          Verdicts donnés : {verdicts.length}
        </p>
      </Showcase>

      <Showcase id="focus" title="FocusTimer">
        <div className="max-w-sm">
          <FocusTimer
            {...DEMO_FOCUS}
            paused={paused}
            onToggle={() => setPaused((p) => !p)}
            onFinish={() => setPaused(true)}
          />
        </div>
      </Showcase>

      <Showcase id="matieres" title="RevioSubjectCard">
        <ul className="grid gap-3 sm:grid-cols-2">
          {DEMO_SUBJECTS.map((s) => (
            <li key={s.id}>
              <RevioSubjectCard subject={s} />
            </li>
          ))}
        </ul>
      </Showcase>

      <Showcase
        id="badges"
        title="BadgeCard"
        note="Commun : aucun effet ; rare : bordure violette lumineuse ; épique : fond encre, carte inclinée avec reflet."
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DEMO_BADGES.map((b) => (
            <li key={b.name}>
              <BadgeCard name={b.name} rarity={b.rarity} Icon={b.Icon} unlocked={b.unlocked} />
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="size-3.5" aria-hidden /> <BookOpen className="size-3.5" aria-hidden />{" "}
          <Award className="size-3.5" aria-hidden /> Icônes Lucide uniquement.
        </p>
      </Showcase>

      <Showcase
        id="navigation"
        title="MobileDock et DesktopSidebar"
        note="Sous 768 px le dock, au-dessus la barre latérale."
      >
        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <DesktopSidebar
            items={DEMO_NAV}
            activeHref="/design-system"
            reviseHref="/design-system#focus"
            profile={DEMO_ME}
            className="h-[34rem]"
          />
          <div className="mx-auto flex w-full max-w-sm items-end pt-10">
            <MobileDock
              items={DEMO_DOCK}
              activeHref="/design-system"
              reviseHref="/design-system#focus"
              className="w-full"
            />
          </div>
        </div>
      </Showcase>
    </div>
  );
}
