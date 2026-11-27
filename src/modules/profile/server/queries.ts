import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { MyProfile } from "../contracts";
import { isNavLayout, type NavLayout } from "@/components/layout/nav-layout";
import { DEFAULT_SETTINGS, type UserSettings } from "../domain/settings";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

const settingsRowSchema = z.object({
  timezone: z.string(),
  daily_goal_minutes: z.number(),
  auto_post: z.boolean(),
  share_subject_in_feed: z.boolean(),
  show_live_status: z.boolean(),
  default_visibility: z.enum(["private", "friends"]),
});

export const SETTINGS_COLUMNS =
  "timezone, daily_goal_minutes, auto_post, share_subject_in_feed, show_live_status, default_visibility";

export function toUserSettings(row: z.infer<typeof settingsRowSchema>): UserSettings {
  return {
    timezone: row.timezone,
    dailyGoalMinutes: row.daily_goal_minutes,
    autoPost: row.auto_post,
    shareSubjectInFeed: row.share_subject_in_feed,
    showLiveStatus: row.show_live_status,
    shareSessionsByDefault: row.default_visibility === "friends",
  };
}

/** Private settings (`user_settings`, owner-only RLS); defaults apply while the row does not exist. */
export async function loadSettings(supabase: Client, userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from("user_settings")
    .select(SETTINGS_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  const parsed = settingsRowSchema.safeParse(data);
  return parsed.success ? toUserSettings(parsed.data) : { ...DEFAULT_SETTINGS };
}

/** The navigation layout the caller chose (`user_settings.nav_layout`), or null when never chosen or unreadable. */
export async function loadNavLayout(supabase: Client, userId: string): Promise<NavLayout | null> {
  const { data } = await supabase
    .from("user_settings")
    .select("nav_layout")
    .eq("user_id", userId)
    .maybeSingle();
  return isNavLayout(data?.nav_layout) ? data.nav_layout : null;
}

/** Whether the caller has not chosen a username yet (light query, used by the app layout). */
export async function lacksUsername(supabase: Client, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (error) throw new Error("Impossible de charger ton profil.");
  return !data?.username;
}

/** What the app shell needs (menu profile card): username, display name and total XP. Two light queries. */
export async function loadShellProfile(supabase: Client, userId: string) {
  const [profile, stats] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", userId).maybeSingle(),
    supabase.from("user_stats").select("total_xp").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile.error) throw new Error("Impossible de charger ton profil.");
  return {
    username: profile.data?.username ?? null,
    displayName: profile.data?.display_name ?? "",
    totalXp: Math.max(0, Number(stats.data?.total_xp ?? 0)),
  };
}

/** The caller's settings. */
export async function getMySettings(): Promise<UserSettings> {
  const { supabase, user } = await requireUser();
  return loadSettings(supabase, user.id);
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
