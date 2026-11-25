import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { requireUser } from "@/lib/auth";
import { SocialProfileView } from "@/modules/social/components/profile/social-profile-view";
import { sharedSessionsOf } from "@/modules/social/domain/profile-view";
import { FIXTURE_PROFILES, FIXTURE_SHARED_POSTS } from "@/modules/social/fixtures-profiles";

export const metadata: Metadata = { title: "Profil d'un ami" };

export default async function FriendProfilePage({ params }: PageProps<"/social/amis/[id]">) {
  await requireUser();
  const { id } = await params;
  // Sample data until getSocialProfile(userId) exists (S-09): only the sample ids resolve.
  const profile = FIXTURE_PROFILES.find((p) => p.id === id);
  if (!profile) notFound();
  return (
    <>
      <Link
        href="/social"
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden /> Retour au social
      </Link>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <MockBadge />
        Données d&apos;exemple : ce profil est inventé. Le vrai profil viendra du serveur (getSocialProfile,
        S-09).
      </p>
      <SocialProfileView profile={profile} sessions={sharedSessionsOf(FIXTURE_SHARED_POSTS, profile.id)} />
    </>
  );
}
