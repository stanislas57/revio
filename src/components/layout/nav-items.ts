import { BarChart3, CalendarDays, Home, Timer, Trophy, User, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Label of the mobile bottom bar; items without one are only in the desktop sidebar. */
  mobileLabel?: string;
};

/**
 * The entries of the desktop sidebar, in the order of the charter (bêta 01, page 4), each on an existing route.
 * The four with a `mobileLabel` (plus the central "Réviser" button, which opens Focus) form the mobile bar.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/accueil", label: "Accueil", icon: Home, mobileLabel: "Accueil" },
  { href: "/agenda", label: "Mon agenda", icon: CalendarDays, mobileLabel: "Agenda" },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/profil/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/social", label: "Mes amis", icon: Users, mobileLabel: "Amis" },
  { href: "/social/classement", label: "Classement", icon: Trophy },
  { href: "/profil", label: "Mon profil", icon: User, mobileLabel: "Profil" },
];

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The entry of `items` the page belongs to: the longest matching route (`/profil/statistiques` before `/profil`). */
export function activeNavHref(pathname: string, items: readonly { href: string }[]): string {
  return (
    items.filter((i) => matches(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href ??
    ""
  );
}
