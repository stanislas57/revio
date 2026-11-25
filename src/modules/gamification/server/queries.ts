import "server-only";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { gamificationSchema, type GamificationStats } from "../schemas";

const EMPTY: GamificationStats = {
  total_xp: 0,
  current_streak: 0,
  best_streak: 0,
  total_minutes: 0,
  completed_sessions: 0,
  days: [],
};

/** XP, streak and recent activity of the signed-in user (computed in SQL). */
export async function getMyGamification(): Promise<GamificationStats> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_gamification");
  if (error) throw new Error("Impossible de charger ta progression.");
  return data ? gamificationSchema.parse(data) : EMPTY;
}

/** XP granted for one session (session + streak bonus), from the ledger. */
export async function getSessionXp(sessionId: string): Promise<{ session: number; streakBonus: number }> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("xp_transactions")
    .select("amount, reason")
    .eq("user_id", user.id)
    .eq("study_session_id", sessionId);
  const rows = z.array(z.object({ amount: z.number(), reason: z.string() })).parse(data ?? []);
  const sum = (reason: string) => rows.filter((r) => r.reason === reason).reduce((a, r) => a + r.amount, 0);
  return { session: sum("session_completed"), streakBonus: sum("streak_bonus") };
}
