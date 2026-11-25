/**
 * XP rules for the demo — Revio convention (decision D-14), editable here.
 * Pure: the SQL function that grants XP must apply exactly these rules
 * (tests on both sides use the same examples).
 */

import type { XpBreakdownItem } from "../contracts";

export const XP_RULES = {
  xpPerMinute: 1,
  /** Below this, the session is saved but earns nothing. */
  minSessionMinutes: 5,
  /** Minutes counted at most per session (no reward for excessive sessions). */
  maxCountedMinutesPerSession: 180,
  /** Duration XP earned at most per day. */
  maxDurationXpPerDay: 300,
  dailyGoalBonus: 50,
  defaultDailyGoalMinutes: 30,
  /** Minutes of finished sessions needed for a streak day (decision D-15). */
  streakDayMinutes: 10,
  streakBonuses: { 7: 100, 21: 250, 30: 500 } as Readonly<Record<number, number>>,
} as const;

export type SessionXpInput = {
  /** Actual study time of the finished session (pauses excluded). */
  durationSeconds: number;
  /** Duration XP already earned today, before this session. */
  durationXpToday: number;
  /** Study minutes already done today, before this session. */
  minutesToday: number;
  dailyGoalMinutes: number;
  dailyGoalAlreadyAwarded: boolean;
  /** Streak length once this session is counted. */
  streakDaysAfter: number;
  /** Streak milestones already rewarded during the current streak. */
  streakBonusesAwarded: readonly number[];
};

export type SessionXp = {
  durationMinutes: number;
  countedMinutes: number;
  belowMinimum: boolean;
  dailyGoalCompleted: boolean;
  breakdown: XpBreakdownItem[];
  total: number;
};

export function computeSessionXp(input: SessionXpInput): SessionXp {
  const durationMinutes = Math.max(0, Math.floor(input.durationSeconds / 60));
  const belowMinimum = durationMinutes < XP_RULES.minSessionMinutes;
  const breakdown: XpBreakdownItem[] = [];

  const cappedMinutes = belowMinimum ? 0 : Math.min(durationMinutes, XP_RULES.maxCountedMinutesPerSession);
  const remainingToday = Math.max(0, XP_RULES.maxDurationXpPerDay - input.durationXpToday);
  const durationXp = Math.min(cappedMinutes * XP_RULES.xpPerMinute, remainingToday);
  const countedMinutes = Math.floor(durationXp / XP_RULES.xpPerMinute);
  if (durationXp > 0) {
    breakdown.push({ reason: "study_duration", xp: durationXp, label: `${countedMinutes} min de révision` });
  }

  const minutesAfter = input.minutesToday + (belowMinimum ? 0 : durationMinutes);
  const dailyGoalCompleted = minutesAfter >= input.dailyGoalMinutes;
  if (!belowMinimum && dailyGoalCompleted && !input.dailyGoalAlreadyAwarded) {
    breakdown.push({ reason: "daily_goal", xp: XP_RULES.dailyGoalBonus, label: "Objectif du jour atteint" });
  }

  const bonus = XP_RULES.streakBonuses[input.streakDaysAfter];
  if (!belowMinimum && bonus && !input.streakBonusesAwarded.includes(input.streakDaysAfter)) {
    breakdown.push({
      reason: "streak_milestone",
      xp: bonus,
      label: `Streak de ${input.streakDaysAfter} jours`,
    });
  }

  return {
    durationMinutes,
    countedMinutes,
    belowMinimum,
    dailyGoalCompleted,
    breakdown,
    total: breakdown.reduce((sum, item) => sum + item.xp, 0),
  };
}
