import "server-only";
import { requireUser } from "@/lib/auth";
import type { MyProfile } from "../contracts";

/** The caller's profile. Timezone and daily goal are fixed until profiles.timezone exists (S-04). */
export async function getMyProfile(): Promise<MyProfile> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger ton profil.");
  return {
    id: user.id,
    username: data?.username ?? null,
    displayName: data?.display_name ?? "",
    avatarUrl: data?.avatar_url ?? null,
    email: user.email ?? "",
    timezone: "Europe/Paris",
    dailyGoalMinutes: 30,
    needsUsername: !data?.username,
  };
}
