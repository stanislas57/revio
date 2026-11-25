"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import { settingsSchemaFor, type UpdateSettingsInput, type UserSettings } from "../domain/settings";
import { SETTINGS_MESSAGES } from "../domain/settings-messages";
import { getLocale } from "./locale";
import { SETTINGS_COLUMNS, toUserSettings } from "./queries";
import { z } from "zod";

const resultSchema = z.object({
  timezone: z.string(),
  daily_goal_minutes: z.number(),
  auto_post: z.boolean(),
  share_subject_in_feed: z.boolean(),
  show_live_status: z.boolean(),
  default_visibility: z.enum(["private", "friends"]),
});

/**
 * Saves the caller's private settings. Everything is validated here with Zod (the time
 * zone included); the database re-checks the zone (trigger) and the goal range, and RLS
 * only lets a user write their own row. No migration: `user_settings` already exists.
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<ActionResult<UserSettings>> {
  const locale = await getLocale();
  const m = SETTINGS_MESSAGES[locale].errors;
  const parsed = settingsSchemaFor(locale).safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail({
      code: "validation",
      message: issue?.message ?? m.invalid,
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
        show_live_status: parsed.data.showLiveStatus,
        default_visibility: parsed.data.shareSessionsByDefault ? "friends" : "private",
      },
      { onConflict: "user_id" },
    )
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) {
    return fail(
      toActionError(error, {
        "22023": m.timezoneUnknown,
        "23514": m.outOfRange,
      }),
    );
  }

  const row = resultSchema.safeParse(data);
  if (!row.success) return fail({ code: "internal", message: m.unexpected });
  refresh();
  return succeed(toUserSettings(row.data));
}
