"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { profileUpdateSchema } from "../schemas";

export type ProfileFormState = { error?: string; info?: string } | undefined;

/** Updates the caller's public identity (pseudo + display name), needed to be found by friends. */
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const parsed = profileUpdateSchema.safeParse({
    username: formData.get("username") ?? "",
    displayName: formData.get("displayName") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ username: parsed.data.username, display_name: parsed.data.displayName })
    .eq("id", user.id);
  if (error) {
    return { error: error.code === "23505" ? "Ce pseudo est déjà pris." : "Enregistrement impossible." };
  }
  refresh();
  return { info: "Profil enregistré." };
}
