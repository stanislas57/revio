import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { levelProgress } from "@/modules/gamification/domain/levels";
import { needsOnboarding, ONBOARDING_BYPASS_COOKIE } from "@/modules/profile/domain/onboarding";
import { OnboardingFlow } from "@/modules/profile/components/onboarding-flow";
import { UsernameGate } from "@/modules/profile/components/username-gate";
import { loadNavLayout, loadShellProfile } from "@/modules/profile/server/queries";
import { loadMyEducation } from "@/modules/profile/server/school";
import { InviteAcceptor } from "@/modules/social/components/invite-acceptor";
import { INVITE_COOKIE } from "@/modules/social/domain/invite";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const me = await loadShellProfile(supabase, user.id);
  // No username yet (right after signing up): nothing else is shown until one is chosen.
  if (!me.username) return <UsernameGate email={user.email ?? ""} />;
  // Then the onboarding (school, study level, gender), once: answered, skipped or "Plus tard". Only when we know
  // it is not done: a failed read or "Continuer sans enregistrer" never keeps anyone out of the app.
  const cookieStore = await cookies();
  const education = await loadMyEducation(supabase, user.id);
  if (needsOnboarding(education, cookieStore.has(ONBOARDING_BYPASS_COOKIE))) {
    return <OnboardingFlow email={user.email ?? ""} username={me.username} />;
  }

  // An invitation link opened before signing up: the friend request is sent now, once the app is open.
  const hasInvite = cookieStore.has(INVITE_COOKIE);

  const navLayout = await loadNavLayout(supabase, user.id);

  const level = levelProgress(me.totalXp);
  const name = me.displayName || me.username;
  return (
    <AppShell
      email={user.email ?? ""}
      navLayout={navLayout}
      profile={{
        name,
        subtitle: `${level.current.name}`,
        initials: name.slice(0, 2).toUpperCase(),
        level: level.current.number,
        xp: level.totalXp,
        // At the last level the bar is full.
        xpMax: level.next?.minXp ?? Math.max(level.totalXp, 1),
      }}
    >
      {hasInvite && <InviteAcceptor />}
      {children}
    </AppShell>
  );
}
