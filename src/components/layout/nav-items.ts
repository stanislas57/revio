import { CalendarDays, Home, Timer, User, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** The 5 main tabs. Order matters: it is the order shown in the UI. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/accueil", label: "Accueil", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/social", label: "Social", icon: Users },
  { href: "/profil", label: "Profil", icon: User },
];
