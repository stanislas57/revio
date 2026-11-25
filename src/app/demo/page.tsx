import type { Metadata } from "next";
import Link from "next/link";
import { NotImplemented } from "@/components/states/not-implemented";
import { Button } from "@/components/ui/button";
import { SessionSummary } from "@/modules/focus/components/session-summary";
import { FIXTURE_SESSION_RESULT, FIXTURE_STUDY_STATS } from "@/modules/focus/fixtures";
import { LevelCard } from "@/modules/gamification/components/level-card";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { StatTiles } from "@/modules/gamification/components/stat-tiles";
import { StreakCard } from "@/modules/gamification/components/streak-card";
import { FIXTURE_LEVEL, FIXTURE_STREAK } from "@/modules/gamification/fixtures";
import { FriendsStudying } from "@/modules/social/components/friends-studying";
import { FIXTURE_FEED, FIXTURE_LIVE_FRIENDS } from "@/modules/social/fixtures";
import { DemoFeed } from "./demo-feed";

export const metadata: Metadata = {
  title: "Démo (données d'exemple)",
  robots: { index: false, follow: false },
};

/**
 * Public, read-only gallery of the signed-in screens rendered with the contract
 * fixtures. Lets previews (e.g. Vercel, phone) show the UI before Supabase exists.
 * Never reads or writes the database.
 */
export default function DemoPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <header className="space-y-3">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Revio
        </Link>
        <NotImplemented feature="Aperçu des écrans connectés avec des données d'exemple inventées. Rien n'est enregistré ; les boutons d'action sont désactivés ou locaux." />
      </header>

      <section className="space-y-4" aria-labelledby="demo-focus">
        <h2 id="demo-focus" className="text-xl font-semibold">
          Focus : fin de séance
        </h2>
        <SessionSummary result={FIXTURE_SESSION_RESULT} />
      </section>

      <section className="space-y-4" aria-labelledby="demo-social">
        <h2 id="demo-social" className="text-xl font-semibold">
          Social
        </h2>
        <FriendsStudying friends={FIXTURE_LIVE_FRIENDS} />
        <DemoFeed posts={FIXTURE_FEED.posts} />
      </section>

      <section className="space-y-4" aria-labelledby="demo-profile">
        <h2 id="demo-profile" className="text-xl font-semibold">
          Profil
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <LevelCard level={FIXTURE_LEVEL} />
          <StreakCard
            streak={FIXTURE_STREAK}
            days={FIXTURE_STUDY_STATS.daily.map(({ date, minutes }) => ({ date, minutes }))}
          />
        </div>
        <StatTiles
          totalMinutes={FIXTURE_STUDY_STATS.totalMinutes}
          sessions={FIXTURE_STUDY_STATS.sessionsCount}
        />
        <LevelLadder currentLevel={FIXTURE_LEVEL.current.number} />
      </section>

      <Button asChild variant="outline">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </main>
  );
}
