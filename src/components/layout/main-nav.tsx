"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/revio/desktop-sidebar";
import { MobileDock, type NavItem as RevioNavItem } from "@/components/revio/mobile-dock";
import { activeNavHref, NAV_ITEMS } from "./nav-items";

export type ShellProfile = {
  name: string;
  subtitle: string;
  initials: string;
  level: number;
  xp: number;
  xpMax: number;
};

const FOCUS = "/focus";

const SIDEBAR_ITEMS: RevioNavItem[] = NAV_ITEMS.map(({ href, label, icon }) => ({ href, label, Icon: icon }));
const MOBILE_ITEMS = NAV_ITEMS.flatMap(({ href, mobileLabel, icon }) =>
  mobileLabel ? [{ href, label: mobileLabel, Icon: icon }] : [],
) as [RevioNavItem, RevioNavItem, RevioNavItem, RevioNavItem];

/** Desktop (md+): the white sidebar with the "Réviser maintenant" button and the profile card. */
export function ShellSidebar({ profile, footer }: { profile: ShellProfile; footer: ReactNode }) {
  const pathname = usePathname();
  return (
    <DesktopSidebar
      className="h-full"
      items={SIDEBAR_ITEMS}
      activeHref={activeNavHref(pathname, SIDEBAR_ITEMS)}
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
