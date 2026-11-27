"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { RevioLogo } from "@/components/revio/logo";
import { PageBlobs } from "@/components/revio/page-blobs";
import { cn } from "@/lib/utils";
import { ShellDock, ShellSidebar, ShellTopNav, type ShellProfile } from "./main-nav";
import { useNavLayout } from "./nav-layout-provider";

/**
 * Places the navigation according to the chosen layout. "sidebar": the white sidebar from 768 px, and under it a
 * header with the logo plus the bottom bar. "top": one horizontal bar at the top of the page on every size (it
 * scrolls sideways on mobile), no sidebar and no bottom bar. The page content is the same in both.
 */
export function ShellFrame({
  profile,
  sidebarFooter,
  headerActions,
  mobileActions,
  children,
}: {
  profile: ShellProfile;
  /** Below the profile card of the sidebar (sign out, theme). */
  sidebarFooter: ReactNode;
  /** Sign out and theme in the top bar. */
  headerActions: ReactNode;
  /** Same actions, compact, in the small header of the sidebar layout on mobile. */
  mobileActions: ReactNode;
  children: ReactNode;
}) {
  const { layout } = useNavLayout();
  const top = layout === "top";

  // One tree for both layouts: the page (`children`) keeps its position, so switching the layout never remounts
  // it (the switcher keeps its state and the page does not reload its data).
  return (
    <div className="flex min-h-dvh" data-nav-layout={layout}>
      {!top && (
        <div className="sticky top-0 hidden h-dvh shrink-0 md:block">
          <ShellSidebar profile={profile} footer={sidebarFooter} />
        </div>
      )}

      <div className="app-column flex min-w-0 flex-1 flex-col">
        {top ? (
          <ShellTopNav profile={profile} actions={headerActions} levelName={profile.subtitle} />
        ) : (
          <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
            <Link
              href="/accueil"
              className="-mx-1 flex min-h-11 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <RevioLogo className="text-2xl" />
            </Link>
            <div className="flex items-center gap-1">{mobileActions}</div>
          </header>
        )}
        <div className="relative flex-1 overflow-x-clip">
          <PageBlobs />
          <main
            className={cn(
              "relative mx-auto w-full max-w-5xl px-4 py-6 text-center md:px-8 md:py-8",
              !top && "pb-28",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {!top && (
        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
          <ShellDock />
        </div>
      )}
    </div>
  );
}
