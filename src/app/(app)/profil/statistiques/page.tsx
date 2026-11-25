import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StudyStatsView } from "@/modules/focus/components/stats/study-stats-view";
import { getStudyStats } from "@/modules/focus/server/stats";

export const metadata: Metadata = { title: "Statistiques" };

export default async function StatistiquesPage() {
  const stats = await getStudyStats();
  return (
    <>
      <Link
        href="/profil"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au profil
      </Link>
      <PageHeader title="Statistiques" description="Ton temps de révision, tes XP et ta régularité." />
      <StudyStatsView stats={stats} />
    </>
  );
}
