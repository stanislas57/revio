"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/revio/desktop-sidebar";
import { MobileDock, type NavItem as RevioNavItem } from "@/components/revio/mobile-dock";
import { TopNav } from "@/components/revio/top-nav";
import { Zap } from "lucide-react";
import { activeNavHref, NAV_ITEMS, PROFILE_HREF } from "./nav-items";

export type ShellProfile = {
  name: string;
  subtitle: string;
  initials: string;
  level: number;
  xp: number;
  xpMax: number;
};

const FOCUS = "/focus";

const SIDEBAR_ITEMS: RevioNavItem[] = NAV_ITEMS.map(({ href, label, icon, children }) => ({
  href,
  label,
  Icon: icon,
  children,
}));
/** The top bar has no central "Réviser" button: Focus is an entry of its own there. */
const TOP_ITEMS: RevioNavItem[] = [...SIDEBAR_ITEMS, { href: FOCUS, label: "Réviser", Icon: Zap }];
const MOBILE_ITEMS = SIDEBAR_ITEMS as [RevioNavItem, RevioNavItem, RevioNavItem, RevioNavItem];

/** Desktop (md+): the white sidebar with the "Réviser maintenant" button and the profile card. */
export function ShellSidebar({ profile, footer }: { profile: ShellProfile; footer: ReactNode }) {
  const pathname = usePathname();
  return (
    <DesktopSidebar
      className="h-full"
      items={SIDEBAR_ITEMS}
      activeHref={activeNavHref(pathname, SIDEBAR_ITEMS)}
      activeChildHref={activeNavHref(
        pathname,
        SIDEBAR_ITEMS.find((i) => i.href === activeNavHref(pathname, SIDEBAR_ITEMS))?.children ?? [],
      )}
      profileHref={PROFILE_HREF}
      homeHref="/accueil"
      reviseHref={FOCUS}
      reviseActive={activeNavHref(pathname, [{ href: FOCUS }]) === FOCUS}
      profile={profile}
      footer={footer}
    />
  );
}

/** Mobile (< md): the bottom bar, four tabs and the raised "Réviser" button (Focus) in the middle. */
export function ShellDock() {
  const pathname = usePathname();
  return (
    <MobileDock
      items={MOBILE_ITEMS}
      activeHref={activeNavHref(pathname, MOBILE_ITEMS)}
      reviseHref={FOCUS}
      reviseActive={activeNavHref(pathname, [{ href: FOCUS }]) === FOCUS}
    />
  );
}

/** "Barre horizontale en haut" layout: every entry (Focus included) in one bar, scrolling sideways on mobile. */
export function ShellTopNav({
  profile,
  actions,
  levelName,
}: {
  profile: ShellProfile;
  actions: ReactNode;
  levelName: string;
}) {
  const pathname = usePathname();
  return (
    <TopNav
      items={TOP_ITEMS}
      activeHref={activeNavHref(pathname, TOP_ITEMS)}
      homeHref="/accueil"
      level={{ number: profile.level, name: levelName }}
      actions={actions}
      className="sticky top-0 z-40"
    />
  );
}
