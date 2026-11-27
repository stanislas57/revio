import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShellProfile } from "./main-nav";
import type { NavLayout } from "./nav-layout";
import { NavLayoutProvider } from "./nav-layout-provider";
import { ShellFrame } from "./shell-frame";
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
 * Responsive shell of the charter. The navigation sits on the left (white sidebar, bottom bar on mobile) or at
 * the top (horizontal bar), as the user chose in Réglages > Apparence. The page sits on Cloud White.
 */
export function AppShell({
  email,
  profile,
  navLayout,
  children,
}: {
  email: string;
  profile: ShellProfile;
  /** Saved choice (null = never chosen: the sidebar). */
  navLayout: NavLayout | null;
  children: React.ReactNode;
}) {
  return (
    <NavLayoutProvider initial={navLayout}>
      <ShellFrame
        profile={profile}
        sidebarFooter={
          <div className="space-y-1 border-t pt-3">
            <p className="truncate px-2 text-center text-xs text-muted-foreground" title={email}>
              {email}
            </p>
            <div className="flex items-center justify-center gap-2">
              <SignOutButton />
              <ThemeToggle />
            </div>
          </div>
        }
        headerActions={
          <>
            <ThemeToggle />
            <SignOutButton compact />
          </>
        }
        mobileActions={
          <>
            <ThemeToggle />
            <SignOutButton compact />
          </>
        }
      >
        {children}
      </ShellFrame>
    </NavLayoutProvider>
  );
}
