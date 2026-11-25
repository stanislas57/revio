import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getMyProfile } from "@/modules/profile/server/queries";
import { LeaderboardView } from "@/modules/social/components/leaderboard/leaderboard-view";
import { getWeeklyLeaderboard } from "@/modules/social/server/leaderboard";
import { joinLeaderboard, leaveLeaderboard } from "@/modules/social/server/leaderboard-actions";

export const metadata: Metadata = { title: "Classement" };

export default async function ClassementPage() {
  const [profile, board] = await Promise.all([getMyProfile(), getWeeklyLeaderboard()]);
  return (
    <>
      <Link
        href="/social"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au social
      </Link>
      <PageHeader title="Classement" description="Tes XP de la semaine, comparés à ceux de tes amis." />
      <LeaderboardView
        entries={board.entries}
        now={new Date().toISOString()}
        timeZone={profile.timezone}
        participation={board.participation}
        onLeave={leaveLeaderboard}
        onJoin={joinLeaderboard}
      />
    </>
  );
}
