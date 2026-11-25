/**
 * SAMPLE DATA for the statistics screen: 30 contiguous days (the contract's `daily`), four subjects
 * and an empty variant. Proposal for Stan's `StudyStats` server. Any screen showing these must
 * display <MockBadge />.
 */

import type { StudyStats } from "./contracts";

const FIRST_DAY = "2026-10-27"; // 30 days ending on FIXTURE_NOW's day, 2026-11-25
const PATTERN = [45, 0, 60, 30, 90, 0, 25, 50, 0, 75, 40, 0, 35, 55, 20, 0, 65, 80, 0, 45];

function day(offset: number): string {
  return new Date(Date.parse(`${FIRST_DAY}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
}

/** XP in the spirit of the demo scale: 1 per minute (5 minimum, 180 max), +50 when the day reaches 30 minutes. */
function xpFor(minutes: number): number {
  if (minutes < 5) return 0;
  return Math.min(minutes, 180) + (minutes >= 30 ? 50 : 0);
}

const daily: StudyStats["daily"] = Array.from({ length: 30 }, (_, i) => {
  const minutes = PATTERN[(i * 7) % PATTERN.length]!;
  return { date: day(i), minutes, xp: xpFor(minutes) };
});

export const FIXTURE_STUDY_STATS_30D: StudyStats = {
  todayMinutes: daily.at(-1)!.minutes,
  weekMinutes: 310,
  monthMinutes: 1240,
  totalMinutes: 2880,
  sessionsCount: 64,
  averageSessionMinutes: 45,
  bySubject: [
    {
      subjectId: "00000000-0000-4000-8000-0000000000a1",
      name: "Statistiques",
      color: "#16a34a",
      minutes: 1100,
    },
    {
      subjectId: "00000000-0000-4000-8000-0000000000a2",
      name: "Droit du travail",
      color: "#2563eb",
      minutes: 820,
    },
    { subjectId: "00000000-0000-4000-8000-0000000000a3", name: "Finance", color: "#f59e0b", minutes: 540 },
    { subjectId: null, name: "Sans matière", color: null, minutes: 420 },
  ],
  daily,
};

export const FIXTURE_STUDY_STATS_EMPTY: StudyStats = {
  todayMinutes: 0,
  weekMinutes: 0,
  monthMinutes: 0,
  totalMinutes: 0,
  sessionsCount: 0,
  averageSessionMinutes: 0,
  bySubject: [],
  daily: Array.from({ length: 30 }, (_, i) => ({ date: day(i), minutes: 0, xp: 0 })),
};
