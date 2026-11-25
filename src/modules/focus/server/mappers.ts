import { levelProgress, nextStreakMilestone } from "@/modules/gamification/domain/levels";
import type { ActiveSession, SessionResult } from "../contracts";
import type { SessionRow } from "../schemas";
import type { z } from "zod";
import type { storedResultSchema } from "../schemas";

export function toActiveSession(
  row: SessionRow,
  serverNow: string = new Date().toISOString(),
): ActiveSession {
  return {
    id: row.id,
    mode: row.mode,
    subject: null,
    label: row.label,
    status: row.paused_at ? "paused" : "running",
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    pausedSeconds: row.paused_seconds,
    plannedMinutes: row.planned_minutes,
    visibility: row.visibility,
    serverNow,
  };
}

/** Builds the contract's SessionResult from the JSON stored by the database. */
export function toSessionResult(stored: z.infer<typeof storedResultSchema>): SessionResult {
  const level = levelProgress(stored.totalXp);
  const before = levelProgress(Math.max(0, stored.totalXp - stored.earnedXp));
  return {
    sessionId: stored.sessionId,
    subjectName: stored.subjectName,
    durationMinutes: stored.durationMinutes,
    countedMinutes: stored.countedMinutes,
    belowMinimum: stored.belowMinimum,
    earnedXp: stored.earnedXp,
    xpBreakdown: stored.xpBreakdown,
    level,
    leveledUp: level.current.number > before.current.number,
    streak: { ...stored.streak, nextMilestone: nextStreakMilestone(stored.streak.currentDays) },
    dailyGoalCompleted: stored.dailyGoalCompleted,
    newAchievements: [],
    postCreated: stored.postCreated,
    alreadyFinalized: stored.alreadyFinalized,
  };
}
