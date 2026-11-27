"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { INVITE_COOKIE, isInviteCode } from "../domain/invite";
import { sendFriendRequest } from "./actions";

export type AcceptInviteResult =
  | { status: "none" }
  | { status: "sent"; name: string }
  | { status: "already" }
  | { status: "self" }
  | { status: "unknown" };

/**
 * Turns the invitation remembered in the cookie into a friend request, once the visitor is signed in (and has a
 * username and went through the onboarding: the app layout only calls this inside the app). The cookie is always
 * removed, so nothing is ever sent twice. Goes through `sendFriendRequest`, hence through the same rules and the
 * same RLS as a request typed by hand: nothing here can reach more than a search by username would.
 */
export async function acceptPendingInvite(): Promise<AcceptInviteResult> {
  const jar = await cookies();
  const code = jar.get(INVITE_COOKIE)?.value ?? "";
  if (code === "") return { status: "none" };
  jar.delete(INVITE_COOKIE);
  if (!isInviteCode(code)) return { status: "unknown" };

  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", code)
    .maybeSingle();
  if (!data || typeof data.id !== "string") return { status: "unknown" };
  if (data.id === user.id) return { status: "self" };

  const res = await sendFriendRequest(data.id);
  if (!res.ok) {
    // A request already exists in one direction or the other: nothing to do, nothing to fear.
    return res.error.message.includes("existe déjà") ? { status: "already" } : { status: "unknown" };
  }
  refresh();
  const name =
    (typeof data.display_name === "string" && data.display_name.trim()) || String(data.username ?? code);
  return { status: "sent", name };
}
