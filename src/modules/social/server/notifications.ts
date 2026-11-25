import "server-only";
import { requireUser } from "@/lib/auth";
import type { NotificationItem, NotificationPrefs } from "../contracts";
import {
  PROFILE_COLUMNS,
  notificationPrefsRowSchema,
  notificationRowSchema,
  profileRowSchema,
} from "../schemas";
import { toPublicUser } from "./mappers";

/** The caller's last 50 notifications, newest first (RLS: owner only). */
export async function listNotifications(): Promise<NotificationItem[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, actor_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Impossible de charger tes notifications.");
  const rows = notificationRowSchema.array().parse(data ?? []);
  if (rows.length === 0) return [];
  const { data: people, error: peopleError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", [...new Set(rows.map((r) => r.actor_id))]);
  if (peopleError) throw new Error("Impossible de charger tes notifications.");
  const byId = new Map(
    profileRowSchema
      .array()
      .parse(people ?? [])
      .map((p) => [p.id, p]),
  );
  return rows.flatMap((r) => {
    const actor = byId.get(r.actor_id);
    return actor
      ? [
          {
            id: r.id,
            kind: r.kind,
            actor: toPublicUser(actor),
            createdAt: r.created_at,
            read: r.read_at !== null,
          },
        ]
      : [];
  });
}

export async function countUnreadNotifications(): Promise<number> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("notifications").select("id").is("read_at", null).limit(100);
  if (error) return 0;
  return data?.length ?? 0;
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("user_settings")
    .select("notify_friend_requests, notify_friend_accepted, notify_reactions")
    .eq("user_id", user.id)
    .maybeSingle();
  const row = notificationPrefsRowSchema.safeParse(data);
  return row.success
    ? {
        friendRequests: row.data.notify_friend_requests,
        friendAccepted: row.data.notify_friend_accepted,
        reactions: row.data.notify_reactions,
      }
    : { friendRequests: true, friendAccepted: true, reactions: true };
}
