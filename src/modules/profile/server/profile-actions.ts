"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/lib/contracts";
import { fail, fromDbError, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import type { MyProfile, UpdateProfileInput } from "../contracts";
import { profileUpdateSchema } from "../schemas";

/** Updates the caller's public identity (pseudo and display name). */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<MyProfile>> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      "validation",
      issue?.message ?? "Données invalides.",
      issue ? { [String(issue.path[0] ?? "")]: issue.message } : undefined,
    );
  }
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select("id, username, display_name, avatar_url")
    .single();
  if (error) return fromDbError(error, { conflict: "Ce pseudo est déjà pris." });
  refresh();
  return ok({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    email: user.email ?? "",
    timezone: "Europe/Paris",
    dailyGoalMinutes: 30,
    needsUsername: !data.username,
  });
}
