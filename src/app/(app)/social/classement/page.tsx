import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockBadge } from "@/components/states/not-implemented";
import { getMyProfile } from "@/modules/profile/server/queries";
import { LeaderboardPreview } from "@/modules/social/components/leaderboard/leaderboard-preview";
import { FIXTURE_LEADERBOARD_WEEK } from "@/modules/social/fixtures-leaderboard";

export const metadata: Metadata = { title: "Classement" };

export default async function ClassementPage({ searchParams }: PageProps<"/social/classement">) {
  const [{ etat, demo }, profile] = await Promise.all([searchParams, getMyProfile()]);
  return (
    <>
      <Link
        href="/social"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au social
      </Link>
      <PageHeader title="Classement" description="Tes XP de la semaine, comparés à ceux de tes amis." />
      <div className="space-y-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <MockBadge />
          Données d&apos;exemple : ces amis et ces XP sont inventés. Le calcul des positions viendra du
          serveur (S-19).
        </p>
        <LeaderboardPreview
          entries={FIXTURE_LEADERBOARD_WEEK}
          now={new Date().toISOString()}
          timeZone={profile.timezone}
          initialParticipation={etat === "quitte" ? "out" : "in"}
          interactive={demo === "1"}
        />
      </div>
    </>
  );
}
