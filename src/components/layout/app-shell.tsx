import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShellDock, ShellSidebar, type ShellProfile } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

function SignOutButton({ compact = false, onInk = false }: { compact?: boolean; onInk?: boolean }) {
  return (
    <form action="/auth/deconnexion" method="post">
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        aria-label="Se déconnecter"
        className={cn(
          "min-h-11",
          compact && "size-11",
          onInk && "text-white hover:bg-revio-ink-3 hover:text-white",
        )}
      >
        <LogOut className="size-4" aria-hidden />
        {!compact && "Se déconnecter"}
      </Button>
    </form>
  );
}

/**
 * Responsive shell of the Revio design: the ink sidebar from 768 px, a header and the floating dock below.
 * The page sits on the "petits carreaux" grid, a fixed decorative layer that fades out.
 */
export function AppShell({
  email,
  profile,
  children,
}: {
  email: string;
  profile: ShellProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <div aria-hidden className="revio-grid pointer-events-none fixed inset-0 -z-10" />
      <div className="sticky top-0 hidden h-dvh shrink-0 p-4 pr-0 md:block">
        <ShellSidebar
          profile={profile}
          footer={
            <div className="space-y-1 border-t border-revio-ink-3 pt-3">
              <p className="truncate px-2 text-xs text-revio-muted-on-ink" title={email}>
                {email}
              </p>
              <div className="flex items-center justify-between">
                <SignOutButton onInk />
                <ThemeToggle className="text-white hover:bg-revio-ink-3 hover:text-white" />
              </div>
            </div>
          }
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between px-4 md:hidden">
          <Link href="/accueil" className="font-heading text-xl font-bold tracking-tight">
            Revio
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-32 md:px-8 md:pb-8">{children}</main>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
        <ShellDock />
      </div>
    </div>
  );
}
