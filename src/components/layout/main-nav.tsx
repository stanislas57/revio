"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/revio/desktop-sidebar";
import { MobileDock, type NavItem as RevioNavItem } from "@/components/revio/mobile-dock";
import { NAV_ITEMS } from "./nav-items";

export type ShellProfile = {
  name: string;
  subtitle: string;
  initials: string;
  level: number;
  xp: number;
  xpMax: number;
};

const FOCUS = "/focus";
const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const toRevio = (
  items: readonly { href: string; label: string; icon: RevioNavItem["Icon"] }[],
): RevioNavItem[] => items.map(({ href, label, icon }) => ({ href, label, Icon: icon }));

function useActiveHref() {
  const pathname = usePathname();
  return {
    activeHref: NAV_ITEMS.find((i) => matches(pathname, i.href))?.href ?? "",
    onFocus: matches(pathname, FOCUS),
  };
}

/** Desktop (md+): the ink sidebar with the "Réviser maintenant" button and the profile card. */
export function ShellSidebar({ profile, footer }: { profile: ShellProfile; footer: ReactNode }) {
  const { activeHref, onFocus } = useActiveHref();
  return (
    <DesktopSidebar
      className="h-full"
      items={toRevio(NAV_ITEMS)}
      activeHref={activeHref}
      homeHref="/accueil"
      reviseHref={FOCUS}
      reviseActive={onFocus}
      profile={profile}
      footer={footer}
    />
  );
}

/** Mobile (< md): the floating ink dock, four tabs and the raised "Réviser" button (Focus) in the middle. */
export function ShellDock() {
  const { activeHref, onFocus } = useActiveHref();
  const tabs = toRevio(NAV_ITEMS.filter((i) => i.href !== FOCUS)) as [
    RevioNavItem,
    RevioNavItem,
    RevioNavItem,
    RevioNavItem,
  ];
  return <MobileDock items={tabs} activeHref={activeHref} reviseHref={FOCUS} reviseActive={onFocus} />;
}
