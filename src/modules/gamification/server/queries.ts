import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { LevelProgress, StreakSummary } from "../contracts";
import { levelProgress } from "../domain/levels";
import { buildStreakSummary, parisDay } from "../domain/streak";

const statsSchema = z.object({
  total_xp: z.number(),
  current_streak: z.number(),
  best_streak: z.number(),
  last_validated_on: z.string().nullable(),
  total_minutes: z.number(),
  sessions_count: z.number(),
});

export type MyGamification = {
  level: LevelProgress;
  streak: StreakSummary;
  totalMinutes: number;
  sessionsCount: number;
  /** Minutes per calendar day (Paris) over the last 28 days. */
  days: { date: string; minutes: number }[];
};

/** XP, level, streak and regularity grid of the signed-in user. */
export async function getMyGamification(): Promise<MyGamification> {
  const { supabase, user } = await requireUser();
  const [stats, daily] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("my_daily_minutes", { p_days: 28 }),
  ]);
  if (stats.error || daily.error) throw new Error("Impossible de charger ta progression.");
  const s = statsSchema.parse(
    stats.data ?? {
      total_xp: 0,
      current_streak: 0,
      best_streak: 0,
      last_validated_on: null,
      total_minutes: 0,
      sessions_count: 0,
    },
  );
  const days = z
    .array(z.object({ day: z.string(), minutes: z.number() }))
    .parse(daily.data ?? [])
    .map((d) => ({ date: d.day, minutes: d.minutes }));
  const today = parisDay(new Date());
  const todayMinutes = days.find((d) => d.date === today)?.minutes ?? 0;
  return {
    level: levelProgress(s.total_xp),
    streak: buildStreakSummary(s, todayMinutes, today),
    totalMinutes: s.total_minutes,
    sessionsCount: s.sessions_count,
    days,
  };
}
