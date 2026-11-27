import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { RevioLogo } from "@/components/revio/logo";
import { OrganicCard } from "@/components/revio/organic-card";
import { getPublicEnv } from "@/lib/env";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { RememberInvite } from "@/modules/social/components/remember-invite";
import { isInviteCode } from "@/modules/social/domain/invite";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
};

/**
 * Public page of an invitation link (`/invite/<username>`). It tells nothing about the sender (an anonymous
 * visitor cannot read profiles): the code is remembered, and the friend request is sent once the visitor is in
 * the app. A signed-in visitor is sent straight to Social.
 */
export default async function InvitePage({ params }: PageProps<"/invite/[code]">) {
  const { code } = await params;
  if (!isInviteCode(code)) notFound();
  await connection();
  let signedIn = false;
  if (getPublicEnv()) {
    const { data } = await (await createClient()).auth.getUser();
    signedIn = !!data.user;
  }

  return (
    <main className="landing-root mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <RememberInvite code={code} signedIn={signedIn} />
      <RevioLogo className="text-4xl" />
      <OrganicCard halo className="w-full gap-4 p-8">
        <h1 className="landing-display text-3xl sm:text-4xl">
          Un ami t&apos;invite <em className="text-brand-text">sur Revio</em>
        </h1>
        <p className="text-muted-foreground">
          Révise avec tes amis : séances Focus, XP et encouragements. Crée ton compte ou connecte-toi, et la
          demande d&apos;ami sera envoyée toute seule.
        </p>
        <div className="flex w-full flex-col gap-3">
          <ChunkyButton asChild block>
            <Link href={LOGIN_PATH}>Rejoindre Revio</Link>
          </ChunkyButton>
          <ChunkyButton asChild block variant="secondary">
            <Link href={LOGIN_PATH}>J&apos;ai déjà un compte</Link>
          </ChunkyButton>
        </div>
      </OrganicCard>
      <p className="text-xs text-muted-foreground">
        Revio est en construction. Aucun paiement n&apos;est demandé, et tes notes restent privées.
      </p>
    </main>
  );
}
