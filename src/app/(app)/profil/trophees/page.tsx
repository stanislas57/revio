import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AchievementGallery } from "@/modules/gamification/components/achievement-gallery";
import { getMyAchievements } from "@/modules/gamification/server/achievements";

export const metadata: Metadata = { title: "Trophées" };

export default async function TropheesPage() {
  const achievements = await getMyAchievements();
  return (
    <>
      <Link
        href="/profil"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au profil
      </Link>
      <PageHeader title="Trophées" description="Tes succès, ceux en cours et ceux qui t'attendent." />
      <AchievementGallery achievements={achievements} now={new Date().toISOString()} />
    </>
  );
}
