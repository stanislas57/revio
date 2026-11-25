/**
 * DEMO DATA of the Revio design system (the `/design-system` page and the mock-up screens).
 * Invented first names, no real user, no backend call. Anything displayed from here must be labelled as an example.
 */
import { Award, BookOpen, Clock, Flame, Home, Layers, Users } from "lucide-react";
import type { NavItem } from "@/components/revio/mobile-dock";
import type { Flashcard } from "@/components/revio/flashcard-stack";
import type { LiveItem } from "@/components/revio/live-activity-feed";
import type { LeagueRow, Quest } from "@/components/revio/logic";
import type { PresenceFriend } from "@/components/revio/avatar-presence";
import type { SharedSheet } from "@/components/revio/shared-sheet-card";
import type { StreakDay } from "@/components/revio/streak-card";
import type { SubjectSummary } from "@/components/revio/subject-card";

export const DEMO_ME = {
  id: "me",
  name: "Inès",
  initials: "IN",
  subtitle: "Terminale · Niv. 12",
  level: 12,
  xp: 1240,
  xpMax: 1500,
};

export const DEMO_PRESENCE: PresenceFriend[] = [
  { id: "leo", name: "Léo", initials: "LB", subject: "Maths", minutes: 18, value: 0.7 },
  { id: "sarah", name: "Sarah", initials: "SA", subject: "SVT", minutes: 9, value: 0.32 },
  { id: "nour", name: "Nour", initials: "NK", subject: null, minutes: 41, value: 0.88 },
  { id: "malo", name: "Malo", initials: "MT", subject: "Anglais", minutes: 22, value: 0.46 },
];

export const DEMO_QUESTS: Quest[] = [
  { id: "cards", label: "Réviser 20 cartes", xp: 30, current: 20, target: 20 },
  { id: "focus", label: "2 sessions focus de 25 min", xp: 50, current: 1, target: 2 },
  { id: "kudos", label: "Envoyer un kudos à un ami", xp: 10, current: 0, target: 1 },
];

/** Monday first. Friday is today (dashed); Wednesday was saved by the joker. */
export const DEMO_WEEK: StreakDay[] = [
  { label: "L", name: "Lundi", state: "done" },
  { label: "M", name: "Mardi", state: "done" },
  { label: "M", name: "Mercredi", state: "joker" },
  { label: "J", name: "Jeudi", state: "done" },
  { label: "V", name: "Vendredi", state: "today" },
  { label: "S", name: "Samedi", state: "empty" },
  { label: "D", name: "Dimanche", state: "empty" },
];

export const DEMO_LIVE: LiveItem[] = [
  { id: "l1", text: "Léo a rejoint la salle Maths", time: "il y a 4 min" },
  { id: "l2", text: "Camille a partagé une fiche", time: "il y a 2 min" },
  { id: "l3", text: "Malo a rejoint la salle Anglais", time: "1 min" },
];
export const DEMO_LIVE_NEXT: LiveItem[] = [
  { id: "l4", text: "Nour a atteint 12 jours de série", time: "à l'instant" },
  { id: "l5", text: "Sarah a terminé une session de 25 min", time: "à l'instant" },
  { id: "l6", text: "Léo a envoyé un kudos à Camille", time: "à l'instant" },
];

const NAMES = [
  "Alix",
  "Camille",
  "Dylan",
  "Emma",
  "Farid",
  "Gaëlle",
  "Hugo",
  "Ilyes",
  "Jade",
  "Kévin",
  "Lola",
  "Maëlle",
  "Nathan",
  "Océane",
  "Paul",
  "Quentin",
  "Rania",
  "Samy",
  "Tess",
  "Ugo",
  "Valentine",
  "Wissem",
  "Yanis",
  "Zoé",
];
/** About thirty students, deterministic: the three of the mock-up (Nour, Léo, Sarah) and the user. */
export const DEMO_LEAGUE: LeagueRow[] = [
  { id: "nour", name: "Nour", xp: 2140 },
  { id: "leo", name: "Léo", xp: 1980 },
  { id: "me", name: "Inès", xp: 1920, isMe: true },
  { id: "sarah", name: "Sarah", xp: 1860 },
  ...NAMES.map((name, i) => ({ id: `s${i}`, name, xp: 1800 - i * 55 })),
];

export const DEMO_SHEET: SharedSheet = {
  id: "derivees",
  title: "Les fonctions dérivées",
  meta: "Maths · Terminale · 18 cartes · 9 min",
  author: "Camille",
  initials: "CM",
  sharedAgo: "il y a 2 h",
  xp: 40,
  reviewedBy: 7,
  href: "/design-system#fiches",
};

export const DEMO_SUBJECTS: SubjectSummary[] = [
  { id: "maths", name: "Maths", value: 0.72, sheets: 12, due: 8, href: "/design-system#matieres" },
  {
    id: "svt",
    name: "SVT",
    value: 0.4,
    sheets: 6,
    due: 5,
    deadline: "Contrôle J-12",
    soon: true,
    href: "/design-system#matieres",
  },
  { id: "histoire", name: "Histoire", value: 0.85, sheets: 9, due: 14, href: "/design-system#matieres" },
  { id: "chimie", name: "Chimie", value: 0.64, sheets: 7, due: 10, href: "/design-system#matieres" },
];

export const DEMO_CARDS: Flashcard[] = [
  { id: "c1", subject: "Histoire", front: "Chute du mur de Berlin ?", back: "9 novembre 1989" },
  {
    id: "c2",
    subject: "SVT",
    front: "Organite qui produit l'énergie de la cellule ?",
    back: "La mitochondrie",
  },
  { id: "c3", subject: "Maths", front: "Dérivée de x² ?", back: "2x" },
  { id: "c4", subject: "Chimie", front: "pH d'une solution neutre à 25 °C ?", back: "7" },
];

export const DEMO_NAV: NavItem[] = [
  { href: "/design-system", label: "Accueil", Icon: Home },
  { href: "/design-system#fil", label: "Fil social", Icon: Users, badge: 3 },
  { href: "/design-system#fiches", label: "Mes fiches", Icon: BookOpen },
  { href: "/design-system#salles", label: "Salles d'étude", Icon: Layers },
  { href: "/design-system#progression", label: "Progression", Icon: Award },
];
export const DEMO_DOCK = DEMO_NAV.filter((i) => i.label !== "Salles d'étude") as [
  NavItem,
  NavItem,
  NavItem,
  NavItem,
];

export const DEMO_BADGES = [
  { name: "1re fiche", rarity: "common" as const, Icon: BookOpen, unlocked: true },
  { name: "10 h focus", rarity: "rare" as const, Icon: Clock, unlocked: true },
  { name: "Mentore", rarity: "epic" as const, Icon: Award, unlocked: true },
  { name: "Série de 30 jours", rarity: "rare" as const, Icon: Flame, unlocked: false },
];

export const DEMO_FOCUS = {
  subject: "SVT · La cellule",
  elapsedSeconds: 444,
  totalSeconds: 1500,
  xpAtEnd: 30,
};
