import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockBadge } from "@/components/states/not-implemented";
import { requireUser } from "@/lib/auth";
import { StudyStatsView } from "@/modules/focus/components/stats/study-stats-view";
import { FIXTURE_STUDY_STATS_30D, FIXTURE_STUDY_STATS_EMPTY } from "@/modules/focus/fixtures-stats";

export const metadata: Metadata = { title: "Statistiques" };

export default async function StatistiquesPage({ searchParams }: PageProps<"/profil/statistiques">) {
  await requireUser();
  const { etat } = await searchParams;
  return (
    <>
      <Link
        href="/profil"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au profil
      </Link>
      <PageHeader title="Statistiques" description="Ton temps de révision, tes XP et ta régularité." />
      <div className="space-y-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <MockBadge />
          Données d&apos;exemple : ces chiffres sont inventés. Les vraies statistiques viendront du serveur
          (S-20).
        </p>
        <StudyStatsView stats={etat === "vide" ? FIXTURE_STUDY_STATS_EMPTY : FIXTURE_STUDY_STATS_30D} />
      </div>
    </>
  );
}
