import { z } from "zod";

export const PLANNED_MINUTES_OPTIONS = [25, 45, 60, 90] as const;

export const startSessionSchema = z.object({
  label: z
    .string()
    .trim()
    .max(60, { error: "60 caractères maximum." })
    .transform((v) => (v === "" ? null : v)),
  plannedMinutes: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(600)])
    .transform((v) => (v === "" ? null : v)),
  share: z.boolean(),
});

export const sessionIdSchema = z.uuid();

export const sessionRowSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  visibility: z.enum(["private", "friends"]),
  planned_minutes: z.number().nullable(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  paused_at: z.string().nullable(),
  paused_seconds: z.number(),
  duration_minutes: z.number().nullable(),
  xp_awarded: z.number().nullable(),
  streak_days: z.number().nullable(),
});
export type SessionRow = z.infer<typeof sessionRowSchema>;

export const SESSION_COLUMNS =
  "id, label, status, visibility, planned_minutes, started_at, ended_at, paused_at, paused_seconds, duration_minutes, xp_awarded, streak_days";

export const completionResultSchema = z.object({
  session_id: z.string(),
  duration_minutes: z.number(),
  xp_session: z.number(),
  xp_streak_bonus: z.number(),
  streak_days: z.number(),
  total_xp: z.number(),
});
