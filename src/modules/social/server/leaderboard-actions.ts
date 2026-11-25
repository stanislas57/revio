"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";

async function setParticipation(show: boolean): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, show_in_leaderboard: show }, { onConflict: "user_id" });
  if (error) return fail(toActionError(error));
  refresh();
  return succeed(null);
}

/** Leave the friends leaderboard: the database then hides the caller from everybody. */
export async function leaveLeaderboard(): Promise<ActionResult<null>> {
  return setParticipation(false);
}

export async function joinLeaderboard(): Promise<ActionResult<null>> {
  return setParticipation(true);
}
