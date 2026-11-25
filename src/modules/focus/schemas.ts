import { z } from "zod";

export const sessionIdSchema = z.uuid();

export const startSessionSchema = z
  .object({
    mode: z.enum(["free", "countdown", "pomodoro"]),
    subjectId: z.uuid().optional(),
    plannedMinutes: z.number().int().min(1).max(600).optional(),
    visibility: z.enum(["private", "friends"]).optional(),
    label: z.string().trim().max(60, { error: "60 caractères maximum." }).optional(),
  })
  .refine((v) => v.mode === "free" || v.plannedMinutes !== undefined, {
    error: "Une durée est nécessaire pour ce mode.",
    path: ["plannedMinutes"],
  });

/** Row of `study_sessions` as read by the client (columns readable by the owner). */
export const sessionRowSchema = z.object({
  id: z.string(),
  mode: z.enum(["free", "countdown", "pomodoro"]),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  visibility: z.enum(["private", "friends"]),
  label: z.string().nullable(),
  planned_minutes: z.number().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  paused_at: z.string().nullable(),
  paused_seconds: z.number(),
  subject_id: z.string().nullable(),
});
export type SessionRow = z.infer<typeof sessionRowSchema>;

export const SESSION_COLUMNS =
  "id, mode, status, visibility, label, planned_minutes, started_at, ended_at, paused_at, paused_seconds, subject_id";

/** JSON stored by `finalize_study_session` (see the migration). */
export const storedResultSchema = z.object({
  sessionId: z.string(),
  subjectName: z.string().nullable(),
  durationMinutes: z.number(),
  countedMinutes: z.number(),
  belowMinimum: z.boolean(),
  earnedXp: z.number(),
  xpBreakdown: z.array(
    z.object({
      reason: z.enum(["study_duration", "daily_goal", "streak_milestone", "planned_session"]),
      xp: z.number(),
      label: z.string(),
    }),
  ),
  totalXp: z.number(),
  dailyGoalCompleted: z.boolean(),
  streak: z.object({
    currentDays: z.number(),
    recordDays: z.number(),
    todayValidated: z.boolean(),
    todayMinutes: z.number(),
    dailyGoalMinutes: z.number(),
    dailyGoalCompleted: z.boolean(),
    lastValidatedOn: z.string().nullable(),
  }),
  postCreated: z.boolean(),
  alreadyFinalized: z.boolean(),
});
