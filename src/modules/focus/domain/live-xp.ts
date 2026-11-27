import { computeSessionXp } from "@/modules/gamification/domain/xp";

/**
 * XP of the duration of a running session, estimated for the full-screen counter. It applies the real rules
 * (`computeSessionXp`): nothing before the minimum duration, then 1 XP per minute, up to the per-session cap.
 * It is only an ESTIMATE: the daily cap, the daily-goal bonus and the streak bonuses depend on the rest of the
 * day and are decided by the database when the session ends (the recap shows the official total).
 */
export function liveXpEstimate(elapsedSeconds: number): number {
  return computeSessionXp({
    durationSeconds: Math.max(0, elapsedSeconds),
    durationXpToday: 0,
    minutesToday: 0,
    dailyGoalMinutes: Number.MAX_SAFE_INTEGER,
    dailyGoalAlreadyAwarded: true,
    streakDaysAfter: 0,
    streakBonusesAwarded: [],
  }).total;
}
