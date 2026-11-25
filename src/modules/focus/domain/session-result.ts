/**
 * Maps the raw summary returned by the SQL function finish_study_session
 * (snake_case jsonb) to the SessionResult contract. Pure; validated with Zod
 * so a schema drift fails loudly instead of showing wrong numbers.
 */

import { z } from "zod";
import { levelProgress, nextStreakMilestone } from "@/modules/gamification/domain/levels";
import type { XpBreakdownItem } from "@/modules/gamification/contracts";
import type { SessionResult } from "../contracts";

const breakdownItem = z.object({
  reason: z.enum(["study_duration", "daily_goal", "streak_milestone", "planned_session"]),
  xp: z.number().int().positive(),
  days: z.number().int().optional(),
});

export const finishSummarySchema = z.object({
  session_id: z.string(),
  already_finalized: z.boolean(),
  subject_name: z.string().nullable(),
  duration_minutes: z.number().int().nonnegative(),
  counted_minutes: z.number().int().nonnegative(),
  below_minimum: z.boolean(),
  earned_xp: z.number().int().nonnegative(),
  breakdown: z.array(breakdownItem),
  total_xp_before: z.number().int().nonnegative(),
  total_xp: z.number().int().nonnegative(),
  streak_days: z.number().int().nonnegative(),
  record_days: z.number().int().nonnegative(),
  day: z.string(),
  today_minutes: z.number().int().nonnegative(),
  today_validated: z.boolean(),
  daily_goal_minutes: z.number().int().positive(),
  daily_goal_completed: z.boolean(),
  post_created: z.boolean(),
});

export type FinishSummary = z.infer<typeof finishSummarySchema>;

function label(item: z.infer<typeof breakdownItem>, countedMinutes: number): string {
  switch (item.reason) {
    case "study_duration":
      return `${countedMinutes} min de révision`;
    case "daily_goal":
      return "Objectif du jour atteint";
    case "streak_milestone":
      return `Streak de ${item.days ?? "?"} jours`;
    case "planned_session":
      return "Séance planifiée terminée";
  }
}

export function toSessionResult(raw: unknown): SessionResult {
  const r = finishSummarySchema.parse(raw);
  const xpBreakdown: XpBreakdownItem[] = r.breakdown.map((item) => ({
    reason: item.reason,
    xp: item.xp,
    label: label(item, r.counted_minutes),
  }));
  const level = levelProgress(r.total_xp);
  return {
    sessionId: r.session_id,
    subjectName: r.subject_name,
    durationMinutes: r.duration_minutes,
    countedMinutes: r.counted_minutes,
    belowMinimum: r.below_minimum,
    earnedXp: r.earned_xp,
    xpBreakdown,
    level,
    leveledUp: level.current.number > levelProgress(r.total_xp_before).current.number,
    streak: {
      currentDays: r.streak_days,
      recordDays: r.record_days,
      todayValidated: r.today_validated,
      todayMinutes: r.today_minutes,
      dailyGoalMinutes: r.daily_goal_minutes,
      dailyGoalCompleted: r.daily_goal_completed,
      nextMilestone: nextStreakMilestone(r.streak_days),
      lastValidatedOn: r.today_validated ? r.day : null,
    },
    dailyGoalCompleted: r.daily_goal_completed,
    newAchievements: [],
    postCreated: r.post_created,
    alreadyFinalized: r.already_finalized,
  };
}
