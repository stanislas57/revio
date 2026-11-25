import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import { UsernameGate } from "@/modules/profile/components/username-gate";
import { lacksUsername } from "@/modules/profile/server/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  // No username yet (right after signing up): nothing else is shown until one is chosen.
  if (await lacksUsername(supabase, user.id)) return <UsernameGate email={user.email ?? ""} />;
  return <AppShell email={user.email ?? ""}>{children}</AppShell>;
}
