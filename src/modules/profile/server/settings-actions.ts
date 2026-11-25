"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import { settingsSchema, type UpdateSettingsInput, type UserSettings } from "../domain/settings";
import { SETTINGS_COLUMNS, toUserSettings } from "./queries";
import { z } from "zod";

const resultSchema = z.object({
  timezone: z.string(),
  daily_goal_minutes: z.number(),
  auto_post: z.boolean(),
  share_subject_in_feed: z.boolean(),
});

/**
 * Saves the caller's private settings. Everything is validated here with Zod (the time
 * zone included); the database re-checks the zone (trigger) and the goal range, and RLS
 * only lets a user write their own row. No migration: `user_settings` already exists.
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<ActionResult<UserSettings>> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail({
      code: "validation",
      message: issue?.message ?? "Réglages invalides.",
      ...(issue ? { fields: { [String(issue.path[0] ?? "")]: issue.message } } : {}),
    });
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        timezone: parsed.data.timezone,
        daily_goal_minutes: parsed.data.dailyGoalMinutes,
        auto_post: parsed.data.autoPost,
        share_subject_in_feed: parsed.data.shareSubjectInFeed,
      },
      { onConflict: "user_id" },
    )
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) {
    return fail(
      toActionError(error, {
        "22023": "Fuseau horaire inconnu.",
        "23514": "Réglage hors des valeurs autorisées.",
      }),
    );
  }

  const row = resultSchema.safeParse(data);
  if (!row.success) return fail({ code: "internal", message: "Réponse inattendue du serveur." });
  refresh();
  return succeed(toUserSettings(row.data));
}
