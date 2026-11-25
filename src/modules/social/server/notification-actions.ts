"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import type { NotificationPrefs } from "../contracts";
import { notificationPrefsInputSchema } from "../schemas";

/** Marks every unread notification of the caller as read (RLS + column grant: only `read_at`). */
export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return fail(toActionError(error));
  refresh();
  return succeed(null);
}

/** Which kinds of notification to receive. Enforced by the database triggers, not only here. */
export async function updateNotificationPrefs(
  input: NotificationPrefs,
): Promise<ActionResult<NotificationPrefs>> {
  const parsed = notificationPrefsInputSchema.safeParse(input);
  if (!parsed.success) return fail({ code: "validation", message: "Préférences invalides." });
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      notify_friend_requests: parsed.data.friendRequests,
      notify_friend_accepted: parsed.data.friendAccepted,
      notify_reactions: parsed.data.reactions,
    },
    { onConflict: "user_id" },
  );
  if (error) return fail(toActionError(error));
  refresh();
  return succeed(parsed.data);
}
