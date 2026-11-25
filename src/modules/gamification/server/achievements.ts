import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { Achievement } from "../contracts";

const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["regularity", "volume", "social", "level"]),
  unlockedAt: z.string().nullable(),
  progress: z.object({ current: z.number().int(), target: z.number().int() }).nullable(),
});

/**
 * The caller's achievements, catalogue order: ONE call to `my_achievements()`, which also
 * catches up awards earned before the feature existed. Awards themselves are written by the
 * database (triggers); nothing here can grant one.
 */
export async function getMyAchievements(): Promise<Achievement[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_achievements");
  if (error) throw new Error("Impossible de charger tes trophées.");
  return achievementSchema.array().parse(data ?? []);
}
