import { z } from "zod";

export const publicProfileSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;

export const feedItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  label: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  xp_awarded: z.number().nullable(),
  streak_days: z.number().nullable(),
  ended_at: z.string(),
  profiles: publicProfileSchema.omit({ id: true }).nullable(),
  session_reactions: z.array(z.object({ user_id: z.string() })),
});
export type FeedItemRow = z.infer<typeof feedItemSchema>;

export const friendOverviewSchema = z.object({
  user_id: z.string(),
  username: z.string().nullable(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  total_xp: z.number(),
  current_streak: z.number(),
  live_started_at: z.string().nullable(),
  live_paused_seconds: z.number().nullable(),
  live_paused_at: z.string().nullable(),
  live_label: z.string().nullable(),
});
export type FriendOverview = z.infer<typeof friendOverviewSchema>;

export const friendshipRowSchema = z.object({
  id: z.string(),
  requester_id: z.string(),
  addressee_id: z.string(),
  status: z.enum(["pending", "accepted"]),
  requester: publicProfileSchema,
  addressee: publicProfileSchema,
});

export const searchQuerySchema = z
  .string()
  .trim()
  .min(2, { error: "Tape au moins 2 caractères." })
  .max(40)
  // Keep only safe characters (used inside a PostgREST filter).
  .transform((q) => q.replace(/[^\p{L}\p{N}_ -]/gu, ""));

export const uuidSchema = z.uuid();
