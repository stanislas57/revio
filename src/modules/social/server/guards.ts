import "server-only";
import type { requireUser } from "@/lib/auth";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

/** True when the caller has chosen a username (required for any social interaction). */
export async function hasUsername(supabase: Client, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  return typeof data?.username === "string" && data.username.length > 0;
}

export const USERNAME_REQUIRED = "Choisis d'abord ton pseudo dans ton profil.";
