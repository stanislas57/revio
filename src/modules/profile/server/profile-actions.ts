"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import type { MyProfile, UpdateProfileInput } from "../contracts";
import { profileUpdateSchema } from "../schemas";
import { loadSettings } from "./queries";

/** Updates the caller's public identity (pseudo and display name). */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<MyProfile>> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail({
      code: "validation",
      message: issue?.message ?? "Données invalides.",
      ...(issue ? { fields: { [String(issue.path[0] ?? "")]: issue.message } } : {}),
    });
  }
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select("id, username, display_name, avatar_url")
    .single();
  if (error) {
    const taken = "Ce pseudo est déjà pris.";
    return fail(toActionError(error, { "23505": taken }));
  }
  const settings = await loadSettings(supabase, user.id);
  refresh();
  return succeed({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    email: user.email ?? "",
    timezone: settings.timezone,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    needsUsername: !data.username,
  });
}
