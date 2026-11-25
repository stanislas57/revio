import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockBadge } from "@/components/states/not-implemented";
import { requireUser } from "@/lib/auth";
import { FIXTURE_NOW } from "@/lib/fixtures";
import { AchievementGallery } from "@/modules/gamification/components/achievement-gallery";
import { FIXTURE_ACHIEVEMENTS_GALLERY } from "@/modules/gamification/fixtures-achievements";

export const metadata: Metadata = { title: "Trophées" };

export default async function TropheesPage() {
  await requireUser();
  return (
    <>
      <Link
        href="/profil"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au profil
      </Link>
      <PageHeader title="Trophées" description="Tes succès, ceux en cours et ceux qui t'attendent." />
      <div className="space-y-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <MockBadge />
          Données d&apos;exemple : aucun de ces trophées n&apos;est réellement obtenu. Le catalogue,
          l&apos;attribution et la progression viendront du serveur (S-18).
        </p>
        {/* FIXTURE_NOW keeps the sample dates stable; use the current date once the server exists. */}
        <AchievementGallery achievements={FIXTURE_ACHIEVEMENTS_GALLERY} now={FIXTURE_NOW} />
      </div>
    </>
  );
}
