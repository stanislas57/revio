/**
 * SAMPLE DATA for the achievements gallery: the two achievements of `fixtures.ts` plus the
 * ones listed in the product brief, so every filter and every state can be seen.
 * Proposal for Stan's catalogue (ids are stable slugs). Any screen showing these must display <MockBadge />.
 */

import type { Achievement } from "./contracts";
import { FIXTURE_ACHIEVEMENTS } from "./fixtures";

const more: Achievement[] = [
  {
    id: "planned_30",
    name: "Discipliné",
    description: "Terminer 30 séances planifiées.",
    category: "regularity",
    unlockedAt: null,
    progress: { current: 12, target: 30 },
  },
  {
    id: "streak_100",
    name: "Indestructible",
    description: "Atteindre une série de 100 jours.",
    category: "regularity",
    unlockedAt: null,
    progress: { current: 0, target: 100 },
  },
  {
    id: "hours_100",
    name: "Marathonien",
    description: "Cumuler 100 heures de révision.",
    category: "volume",
    unlockedAt: null,
    progress: { current: 48, target: 100 },
  },
  {
    id: "weekly_goal",
    name: "Objectif atteint",
    description: "Atteindre ton objectif de la semaine.",
    category: "volume",
    unlockedAt: "2026-11-24T20:00:00Z",
    progress: null,
  },
  {
    id: "academic_goal",
    name: "Major",
    description: "Atteindre ton objectif académique personnel.",
    category: "volume",
    unlockedAt: null,
    progress: null,
  },
  {
    id: "collective_25",
    name: "Team Player",
    description: "Terminer 25 séances collectives.",
    category: "social",
    unlockedAt: null,
    progress: { current: 3, target: 25 },
  },
  {
    id: "ambassador",
    name: "Ambassadeur",
    description: "Inviter 10 amis qui restent actifs.",
    category: "social",
    unlockedAt: null,
    progress: { current: 0, target: 10 },
  },
  {
    id: "level_expert",
    name: "Expert",
    description: "Atteindre le niveau Expert (5 000 XP).",
    category: "level",
    unlockedAt: null,
    progress: { current: 4280, target: 5000 },
  },
  {
    id: "xp_50000",
    name: "Légende",
    description: "Cumuler 50 000 XP.",
    category: "level",
    unlockedAt: null,
    progress: { current: 4280, target: 50000 },
  },
  {
    id: "league_diamond",
    name: "Diamant",
    description: "Accéder à la ligue Diamant.",
    category: "level",
    unlockedAt: null,
    progress: null,
  },
];

export const FIXTURE_ACHIEVEMENTS_GALLERY: Achievement[] = [...FIXTURE_ACHIEVEMENTS, ...more];
