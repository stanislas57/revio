import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav, SidebarNav } from "./main-nav";
import { ThemeToggle } from "./theme-toggle";

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/deconnexion" method="post">
      <Button type="submit" variant="ghost" size={compact ? "icon" : "sm"} aria-label="Se déconnecter">
        <LogOut className="size-4" aria-hidden />
        {!compact && "Se déconnecter"}
      </Button>
    </form>
  );
}

/** Responsive shell: sidebar on desktop (md+), header + bottom tab bar on mobile. */
export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link href="/accueil" className="mb-6 px-3 text-lg font-bold tracking-tight">
          Revio
        </Link>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <p className="truncate px-3 text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <div className="flex items-center justify-between">
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link href="/accueil" className="text-lg font-bold tracking-tight">
            Revio
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
