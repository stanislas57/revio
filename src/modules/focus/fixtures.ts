/**
 * SAMPLE DATA for building the Focus UI before the backend exists.
 * Any screen showing these must display <MockBadge />.
 */

import { FIXTURE_NOW } from "@/lib/fixtures";
import { FIXTURE_LEVEL, FIXTURE_STREAK } from "@/modules/gamification/fixtures";
import { levelProgress } from "@/modules/gamification/domain/levels";
import type { ActiveSession, SessionResult, StudyStats } from "./contracts";

const subject = { id: "00000000-0000-4000-8000-0000000000a1", name: "Statistiques", color: "#16a34a" };

export const FIXTURE_SESSION_RUNNING: ActiveSession = {
  id: "00000000-0000-4000-8000-0000000000b1",
  mode: "free",
  subject,
  status: "running",
  startedAt: "2026-11-25T16:45:00Z",
  pausedAt: null,
  pausedSeconds: 0,
  plannedMinutes: null,
  visibility: "friends",
  serverNow: FIXTURE_NOW,
};

export const FIXTURE_SESSION_PAUSED: ActiveSession = {
  ...FIXTURE_SESSION_RUNNING,
  status: "paused",
  pausedAt: "2026-11-25T17:20:00Z",
  pausedSeconds: 120,
};

export const FIXTURE_SESSION_COUNTDOWN: ActiveSession = {
  ...FIXTURE_SESSION_RUNNING,
  id: "00000000-0000-4000-8000-0000000000b2",
  mode: "countdown",
  plannedMinutes: 50,
  subject: null,
};

export const FIXTURE_SESSION_RESULT: SessionResult = {
  sessionId: FIXTURE_SESSION_RUNNING.id,
  subjectName: "Statistiques",
  durationMinutes: 45,
  countedMinutes: 45,
  belowMinimum: false,
  earnedXp: 95,
  xpBreakdown: [
    { reason: "study_duration", xp: 45, label: "45 min de révision" },
    { reason: "daily_goal", xp: 50, label: "Objectif du jour atteint" },
  ],
  level: FIXTURE_LEVEL,
  leveledUp: false,
  streak: FIXTURE_STREAK,
  dailyGoalCompleted: true,
  newAchievements: [],
  postCreated: true,
  alreadyFinalized: false,
};

/** Level-up case: 2 950 XP + 95 XP → Challenger. */
export const FIXTURE_SESSION_RESULT_LEVEL_UP: SessionResult = {
  ...FIXTURE_SESSION_RESULT,
  level: levelProgress(3045),
  leveledUp: true,
};

/** Too short: saved, no XP, no post. */
export const FIXTURE_SESSION_RESULT_TOO_SHORT: SessionResult = {
  ...FIXTURE_SESSION_RESULT,
  durationMinutes: 3,
  countedMinutes: 0,
  belowMinimum: true,
  earnedXp: 0,
  xpBreakdown: [],
  level: levelProgress(4185),
  streak: { ...FIXTURE_STREAK, todayMinutes: 3, todayValidated: false, dailyGoalCompleted: false },
  dailyGoalCompleted: false,
  postCreated: false,
};

export const FIXTURE_STUDY_STATS: StudyStats = {
  todayMinutes: 45,
  weekMinutes: 310,
  monthMinutes: 1240,
  totalMinutes: 2880,
  sessionsCount: 64,
  averageSessionMinutes: 45,
  bySubject: [
    { subjectId: subject.id, name: "Statistiques", color: "#16a34a", minutes: 1100 },
    { subjectId: null, name: "Sans matière", color: null, minutes: 1780 },
  ],
  daily: [
    { date: "2026-11-23", minutes: 60, xp: 110 },
    { date: "2026-11-24", minutes: 0, xp: 0 },
    { date: "2026-11-25", minutes: 45, xp: 95 },
  ],
};
