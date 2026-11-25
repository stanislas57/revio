import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import type { MyProfile } from "../contracts";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

const settingsSchema = z.object({ timezone: z.string(), daily_goal_minutes: z.number() });

/** Private settings (`user_settings`); defaults apply while the row does not exist. */
export async function loadSettings(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("user_settings")
    .select("timezone, daily_goal_minutes")
    .eq("user_id", userId)
    .maybeSingle();
  const parsed = settingsSchema.safeParse(data);
  return {
    timezone: parsed.success ? parsed.data.timezone : "Europe/Paris",
    dailyGoalMinutes: parsed.success ? parsed.data.daily_goal_minutes : XP_RULES.defaultDailyGoalMinutes,
  };
}

/** The caller's profile. */
export async function getMyProfile(): Promise<MyProfile> {
  const { supabase, user } = await requireUser();
  const [profile, settings] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    loadSettings(supabase, user.id),
  ]);
  if (profile.error) throw new Error("Impossible de charger ton profil.");
  return {
    id: user.id,
    username: profile.data?.username ?? null,
    displayName: profile.data?.display_name ?? "",
    avatarUrl: profile.data?.avatar_url ?? null,
    email: user.email ?? "",
    timezone: settings.timezone,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    needsUsername: !profile.data?.username,
  };
}
