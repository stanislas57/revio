import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevioLogo } from "@/components/revio/logo";
import { cn } from "@/lib/utils";
import { ShellDock, ShellSidebar, type ShellProfile } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/deconnexion" method="post">
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        aria-label="Se déconnecter"
        className={cn("min-h-11", compact && "size-11")}
      >
        <LogOut className="size-4" aria-hidden />
        {!compact && "Se déconnecter"}
      </Button>
    </form>
  );
}

/**
 * Responsive shell of the charter: the white sidebar from 768 px; below, a header with the logo and the bottom
 * bar. The page sits on Cloud White (`bg-background`).
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
      <div className="sticky top-0 hidden h-dvh shrink-0 md:block">
        <ShellSidebar
          profile={profile}
          footer={
            <div className="space-y-1 border-t pt-3">
              <p className="truncate px-2 text-xs text-muted-foreground" title={email}>
                {email}
              </p>
              <div className="flex items-center justify-between">
                <SignOutButton />
                <ThemeToggle />
              </div>
            </div>
          }
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <Link
            href="/accueil"
            className="-mx-1 flex min-h-11 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <RevioLogo className="text-2xl" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:py-8">{children}</main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <ShellDock />
      </div>
    </div>
  );
}
