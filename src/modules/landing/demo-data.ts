/**
 * DEMO DATA of the public landing page. Invented: no user, no backend call, no XP computed by the server.
 * Anything shown from here must be labelled as an example. The levels and the XP rules come from the game
 * engine (`gamification/domain`), so the demo cannot drift from the product.
 */

import { levelProgress } from "@/modules/gamification/domain/levels";
import { XP_RULES } from "@/modules/gamification/domain/xp";

// ---- XP and level -----------------------------------------------------------------------------------
export const DEMO_XP = 4280;
export const DEMO_LEVEL = levelProgress(DEMO_XP); // Challenger, 64 % towards Expert, 720 XP missing

// ---- Streak (shown in the session preview) ------------------------------------------------------------
export const DEMO_STREAK_DAYS = 15;

// ---- Friends studying now (invented first names). The subject is shown only when a friend shares it. ----
export const DEMO_FRIENDS_LIVE: { name: string; minutes: number; subject: string | null }[] = [
  { name: "Léa", minutes: 42, subject: "Statistiques" },
  { name: "Noah", minutes: 18, subject: null },
  { name: "Inès", minutes: 27, subject: "Droit des contrats" },
  { name: "Hugo", minutes: 9, subject: null },
];

// ---- Feed ----------------------------------------------------------------------------------------------
export const DEMO_FEED: {
  initials: string;
  name: string;
  text: string;
  subject: string | null;
  kudos: number;
}[] = [
  { initials: "LE", name: "Léa", text: "a terminé 45 min de", subject: "Statistiques", kudos: 8 },
  { initials: "NO", name: "Noah", text: "a terminé 30 min de révision", subject: null, kudos: 3 },
  { initials: "IN", name: "Inès", text: "a terminé 1 h de", subject: "Droit des contrats", kudos: 5 },
];

// ---- End of a session: 65 minutes (1 XP per minute) + the daily goal bonus = +115 XP ---------------------
export const DEMO_SESSION = {
  minutes: 65,
  breakdown: [
    { label: "65 min de révision", xp: 65 },
    { label: "Objectif du jour atteint", xp: XP_RULES.dailyGoalBonus },
  ],
};
export const DEMO_SESSION_XP = DEMO_SESSION.breakdown.reduce((sum, item) => sum + item.xp, 0);
