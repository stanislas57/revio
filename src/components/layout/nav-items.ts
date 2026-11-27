import { BarChart3, CalendarDays, Home, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Sub-pages, shown under the entry in the desktop sidebar while it is the current one. */
  children?: { href: string; label: string }[];
};

/**
 * The four entries of the menu (Accueil, Social, Notes, Agenda), in the order of the design, each on an existing
 * route. All four are on the mobile bar too, around the raised "Réviser" button (Focus). The profile, the
 * statistics and the ranking have no entry of their own: the profile is the card of the sidebar (and the avatar
 * of the header), the statistics a link of the profile, the ranking a link of Social.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/accueil", label: "Accueil", icon: Home },
  { href: "/social", label: "Social", icon: Users },
  {
    href: "/notes",
    label: "Notes",
    icon: BarChart3,
    children: [
      { href: "/notes", label: "Mes notes" },
      { href: "/notes/simulateur", label: "Simulateur & scénarios" },
      { href: "/notes/temps", label: "Répartir mon temps" },
      { href: "/notes/importer", label: "Importer · ajouter" },
    ],
  },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];

/** Where the profile card and the avatar lead. */
export const PROFILE_HREF = "/profil";

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The entry of `items` the page belongs to: the longest matching route (`/notes/temps` belongs to `/notes`). */
export function activeNavHref(pathname: string, items: readonly { href: string }[]): string {
  return (
    items.filter((i) => matches(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href ??
    ""
  );
}
