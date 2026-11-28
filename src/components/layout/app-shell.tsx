import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShellProfile } from "./main-nav";
import type { NavLayout } from "./nav-layout";
import { PROFILE_HREF } from "./nav-items";
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

/** The avatar of the headers: the profile has no entry in the menu, this is the way to it on a small screen. */
function ProfileLink({ profile }: { profile: ShellProfile }) {
  return (
    <Link
      href={PROFILE_HREF}
      aria-label={`Mon profil : ${profile.name}`}
      className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand-soft-foreground"
      >
        <UserRound className="size-5" />
      </span>
    </Link>
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
            <ProfileLink profile={profile} />
            <ThemeToggle />
            <SignOutButton compact />
          </>
        }
        mobileActions={
          <>
            <ProfileLink profile={profile} />
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
