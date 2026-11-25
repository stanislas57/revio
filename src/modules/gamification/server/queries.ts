import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/modules/profile/server/queries";
import type { LevelProgress, StreakSummary } from "../contracts";
import { levelProgress } from "../domain/levels";
import { buildStreakSummary, minutesPerDay, today } from "../domain/streak-display";

const statsSchema = z.object({
  total_xp: z.number(),
  current_streak: z.number(),
  record_streak: z.number(),
  last_validated_on: z.string().nullable(),
  total_study_seconds: z.number(),
});

const sessionSchema = z.object({
  ended_at: z.string(),
  started_at: z.string(),
  paused_seconds: z.number(),
});

export type MyGamification = {
  level: LevelProgress;
  streak: StreakSummary;
  totalMinutes: number;
  sessionsCount: number;
  /** Minutes per calendar day (user's time zone) over the last 28 days. */
  days: { date: string; minutes: number }[];
};

/** XP, level, streak and regularity grid of the signed-in user (reads `user_stats` and own sessions). */
export async function getMyGamification(): Promise<MyGamification> {
  const { supabase, user } = await requireUser();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [stats, recent, count, settings] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("study_sessions")
      .select("started_at, ended_at, paused_seconds")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("ended_at", since),
    // Counted in code: a user has far fewer than 1 000 sessions in the demo period.
    supabase.from("study_sessions").select("id").eq("user_id", user.id).eq("status", "completed").limit(1000),
    loadSettings(supabase, user.id),
  ]);
  if (stats.error || recent.error || count.error) throw new Error("Impossible de charger ta progression.");

  const s = statsSchema.parse(
    stats.data ?? {
      total_xp: 0,
      current_streak: 0,
      record_streak: 0,
      last_validated_on: null,
      total_study_seconds: 0,
    },
  );
  const days = minutesPerDay(
    z
      .array(sessionSchema)
      .parse(recent.data ?? [])
      .map((r) => ({
        endedAt: r.ended_at,
        // Same formula as study_session_seconds(): wall time minus pauses.
        seconds: Math.max(0, (Date.parse(r.ended_at) - Date.parse(r.started_at)) / 1000 - r.paused_seconds),
      })),
    settings.timezone,
  );
  const day = today(new Date(), settings.timezone);
  const todayMinutes = days.find((d) => d.date === day)?.minutes ?? 0;
  return {
    level: levelProgress(s.total_xp),
    streak: buildStreakSummary(s, todayMinutes, day, settings.dailyGoalMinutes),
    totalMinutes: Math.floor(s.total_study_seconds / 60),
    sessionsCount: count.data?.length ?? 0,
    days,
  };
}
