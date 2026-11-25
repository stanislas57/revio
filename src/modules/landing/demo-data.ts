/**
 * DEMO DATA of the public landing page. Invented: no user, no backend call, no XP computed by the server.
 * Anything shown from here must be labelled as an example. The levels, the streak milestones and the XP
 * rules come from the game engine (`gamification/domain`), so the demo cannot drift from the product.
 */

import type { Achievement, StreakSummary } from "@/modules/gamification/contracts";
import { levelProgress, nextStreakMilestone } from "@/modules/gamification/domain/levels";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import type { StudyStats } from "@/modules/focus/contracts";

/** A Sunday, so "this week" (Monday to Sunday) is exactly the last 7 days of the demo. */
export const DEMO_TODAY = "2026-11-22";

const DAY_MS = 86_400_000;
const dayBefore = (n: number) =>
  new Date(Date.parse(`${DEMO_TODAY}T00:00:00Z`) - n * DAY_MS).toISOString().slice(0, 10);

// ---- XP and level -----------------------------------------------------------------------------------
export const DEMO_XP = 4280;
export const DEMO_LEVEL = levelProgress(DEMO_XP); // Challenger, 64 % towards Expert, 720 XP missing

// ---- Streak -----------------------------------------------------------------------------------------
export const DEMO_STREAK_DAYS = 15;
export const DEMO_STREAK: StreakSummary = {
  currentDays: DEMO_STREAK_DAYS,
  recordDays: 24,
  todayValidated: true,
  todayMinutes: 65,
  dailyGoalMinutes: 30,
  dailyGoalCompleted: true,
  nextMilestone: nextStreakMilestone(DEMO_STREAK_DAYS), // 21
  lastValidatedOn: DEMO_TODAY,
};

/** Minutes per day, oldest first, 30 days: a rest day, then 15 validated days in a row (the streak). */
const MINUTES_OLDEST_FIRST = [
  // 14 older days, with rest days (a rest day never removes the record)
  35, 0, 50, 25, 0, 40, 60, 0, 30, 45, 20, 0, 55, 35,
  // the day that ended the previous run
  0,
  // 15 validated days, the last 7 add up to 12 h 30 (750 min)
  40, 25, 55, 30, 45, 35, 60, 20, 120, 100, 45, 150, 130, 140, 65,
];

export const DEMO_DAILY: StudyStats["daily"] = MINUTES_OLDEST_FIRST.map((minutes, i) => ({
  date: dayBefore(MINUTES_OLDEST_FIRST.length - 1 - i),
  minutes,
  // The demo XP of a day is its minutes (1 XP per minute); bonuses are left out of the heatmap.
  xp: minutes,
}));

export const DEMO_WEEK_MINUTES = DEMO_DAILY.slice(-7).reduce((sum, d) => sum + d.minutes, 0); // 750 = 12 h 30
export const DEMO_STREAK_DAY_LIST = DEMO_DAILY.map((d) => ({ date: d.date, minutes: d.minutes }));

// ---- Goals (the weekly goal does not exist in the product yet: shown as an example) --------------------
export const DEMO_GOALS = {
  daily: { doneMinutes: 65, targetMinutes: 30 },
  weekly: { doneMinutes: DEMO_WEEK_MINUTES, targetMinutes: 900 },
};

// ---- Trophies: one per state, consistent with the demo user (15-day streak, 48 h studied, nobody invited) ----
// Names and descriptions follow the sample catalogue of the achievements gallery; the states are the demo user's.
export const DEMO_TROPHIES: { label: string; achievement: Achievement }[] = [
  {
    label: "Débloqué",
    achievement: {
      id: "streak_7",
      name: "Régulier",
      description: "Atteindre un streak de 7 jours.",
      category: "regularity",
      unlockedAt: "2026-11-08T18:00:00Z",
      progress: { current: 7, target: 7 },
    },
  },
  {
    label: "En cours",
    achievement: {
      id: "hours_100",
      name: "Marathonien",
      description: "Cumuler 100 heures de révision.",
      category: "volume",
      unlockedAt: null,
      progress: { current: 48, target: 100 },
    },
  },
  {
    label: "Verrouillé",
    achievement: {
      id: "ambassador",
      name: "Ambassadeur",
      description: "Inviter 10 amis qui restent actifs.",
      category: "social",
      unlockedAt: null,
      progress: { current: 0, target: 10 },
    },
  },
];

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

// ---- The six cards around the hero ---------------------------------------------------------------------
export type DemoCardId = "progression-xp" | "serie" | "trophees" | "objectifs" | "amis" | "stats";

export const DEMO_CARDS: { id: DemoCardId; title: string; value: string; hint: string }[] = [
  {
    id: "progression-xp",
    title: "XP et niveau",
    value: `${DEMO_LEVEL.current.name} · 4 280 XP`,
    hint: "Niveau 4",
  },
  { id: "serie", title: "Série", value: `${DEMO_STREAK_DAYS} jours`, hint: "Record : 24 jours" },
  { id: "trophees", title: "Trophée", value: "Régulier", hint: "Débloqué" },
  { id: "objectifs", title: "Objectif du jour", value: "100 %", hint: "65 min sur 30" },
  { id: "amis", title: "Amis en révision", value: String(DEMO_FRIENDS_LIVE.length), hint: "en ce moment" },
  { id: "stats", title: "Statistiques", value: "12 h 30", hint: "cette semaine" },
];
