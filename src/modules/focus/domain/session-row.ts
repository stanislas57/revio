/** Maps a study_sessions row (snake_case) to the ActiveSession contract. Pure. */

import { z } from "zod";
import type { ActiveSession } from "../contracts";

export const SESSION_COLUMNS =
  "id, mode, subject_id, status, started_at, paused_at, paused_seconds, planned_minutes, visibility";

export const sessionRowSchema = z.object({
  id: z.string(),
  mode: z.enum(["free", "countdown", "pomodoro"]),
  subject_id: z.string().nullable(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  started_at: z.string(),
  paused_at: z.string().nullable(),
  paused_seconds: z.number().int().nonnegative(),
  planned_minutes: z.number().int().nullable(),
  visibility: z.enum(["private", "friends"]),
});

export type SessionRow = z.infer<typeof sessionRowSchema>;
export type SubjectRef = { id: string; name: string; color: string | null };

/** null when the session is no longer running. */
export function toActiveSession(
  raw: unknown,
  subject: SubjectRef | null,
  serverNow: string,
): ActiveSession | null {
  const row = sessionRowSchema.parse(raw);
  if (row.status !== "in_progress") return null;
  return {
    id: row.id,
    mode: row.mode,
    subject: row.subject_id && subject?.id === row.subject_id ? subject : null,
    status: row.paused_at ? "paused" : "running",
    startedAt: new Date(row.started_at).toISOString(),
    pausedAt: row.paused_at ? new Date(row.paused_at).toISOString() : null,
    pausedSeconds: row.paused_seconds,
    plannedMinutes: row.planned_minutes,
    visibility: row.visibility,
    serverNow,
  };
}
