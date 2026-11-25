"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { uuidSchema } from "../schemas";
import { searchProfiles } from "./queries";

export type SocialActionResult = { error?: string } | undefined;

function parseId(id: unknown): string | null {
  const r = uuidSchema.safeParse(id);
  return r.success ? r.data : null;
}

export async function sendFriendRequest(profileId: string): Promise<SocialActionResult> {
  const id = parseId(profileId);
  if (!id) return { error: "Utilisateur invalide." };
  const { supabase, user } = await requireUser();
  if (id === user.id) return { error: "Tu ne peux pas t'ajouter toi-même." };
  const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: id });
  if (error) return { error: error.code === "23505" ? "Une demande existe déjà." : "Demande impossible." };
  refresh();
}

/** Only the addressee can accept (enforced by RLS). */
export async function acceptFriendRequest(friendshipId: string): Promise<SocialActionResult> {
  const id = parseId(friendshipId);
  if (!id) return { error: "Demande invalide." };
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "Impossible d'accepter cette demande." };
  refresh();
}

/** Decline a received request, cancel a sent one or remove a friend. */
export async function removeFriendship(friendshipId: string): Promise<SocialActionResult> {
  const id = parseId(friendshipId);
  if (!id) return { error: "Demande invalide." };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("friendships").delete().eq("id", id);
  if (error) return { error: "Action impossible." };
  refresh();
}

/** Remove the friendship with a given user (from the friends list). */
export async function removeFriend(profileId: string): Promise<SocialActionResult> {
  const id = parseId(profileId);
  if (!id) return { error: "Utilisateur invalide." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`,
    );
  if (error) return { error: "Action impossible." };
  refresh();
}

export async function toggleReaction(sessionId: string, react: boolean): Promise<SocialActionResult> {
  const id = parseId(sessionId);
  if (!id) return { error: "Séance invalide." };
  const { supabase, user } = await requireUser();
  const { error } = react
    ? await supabase.from("session_reactions").insert({ session_id: id })
    : await supabase.from("session_reactions").delete().eq("session_id", id).eq("user_id", user.id);
  if (error && error.code !== "23505") return { error: "Réaction impossible." };
  refresh();
}

/** Search users (wrapper so a Client Component can call it). */
export async function searchUsers(query: string) {
  return searchProfiles(query);
}
