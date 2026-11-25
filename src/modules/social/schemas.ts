import { z } from "zod";

export const uuidSchema = z.uuid();

export const profileRowSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
});
export type ProfileRow = z.infer<typeof profileRowSchema>;

export const PROFILE_COLUMNS = "id, username, display_name, avatar_url";

export const friendshipRowSchema = z.object({
  id: z.string(),
  requester_id: z.string(),
  addressee_id: z.string(),
  status: z.enum(["pending", "accepted"]),
  created_at: z.string(),
  responded_at: z.string().nullable(),
});

export const statsRowSchema = z.object({
  user_id: z.string(),
  total_xp: z.number(),
  current_streak: z.number(),
  last_validated_on: z.string().nullable(),
});

export const liveRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  started_at: z.string(),
  paused_at: z.string().nullable(),
  paused_seconds: z.number(),
});

export const postRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.literal("study_session_completed"),
  subject_name: z.string().nullable(),
  duration_minutes: z.number(),
  earned_xp: z.number(),
  streak_days: z.number(),
  created_at: z.string(),
});

export const reactionRowSchema = z.object({ post_id: z.string(), user_id: z.string() });

/** Prefix of a username: 3 to 24 characters among a-z, 0-9 and _. */
export const searchQuerySchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, { error: "Tape 3 à 24 caractères : lettres, chiffres ou _." });

export const feedInputSchema = z.object({
  cursor: z.string().max(40).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});
