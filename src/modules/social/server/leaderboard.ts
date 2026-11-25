import "server-only";
import { requireUser } from "@/lib/auth";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { leaderboardRowSchema } from "../schemas";
import { toLeaderboardEntry } from "./mappers";

export type WeeklyLeaderboard = { participation: "in" | "out"; entries: LeaderboardEntry[] };

/**
 * Weekly XP of the caller and their accepted friends. Ranks come from the database function
 * `weekly_leaderboard()` (security definer, XP only). Someone who left the board gets no entries.
 */
export async function getWeeklyLeaderboard(): Promise<WeeklyLeaderboard> {
  const { supabase, user } = await requireUser();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("show_in_leaderboard")
    .eq("user_id", user.id)
    .maybeSingle();
  if (settings?.show_in_leaderboard === false) return { participation: "out", entries: [] };

  const { data, error } = await supabase.rpc("weekly_leaderboard");
  if (error) throw new Error("Impossible de charger le classement.");
  return {
    participation: "in",
    entries: leaderboardRowSchema
      .array()
      .parse(data ?? [])
      .map(toLeaderboardEntry),
  };
}
