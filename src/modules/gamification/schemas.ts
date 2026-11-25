import { z } from "zod";

export const gamificationSchema = z.object({
  total_xp: z.number(),
  current_streak: z.number(),
  best_streak: z.number(),
  total_minutes: z.number(),
  completed_sessions: z.number(),
  days: z.array(z.object({ date: z.string(), minutes: z.number() })),
});
export type GamificationStats = z.infer<typeof gamificationSchema>;
