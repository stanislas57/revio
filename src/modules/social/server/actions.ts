"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/lib/contracts";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import { today as todayInParis } from "@/modules/gamification/domain/streak-display";
import type { Friend, FriendRequest, ReactionState, Relation, UserSearchResult } from "../contracts";
import {
  PROFILE_COLUMNS,
  friendshipRowSchema,
  profileRowSchema,
  searchQuerySchema,
  statsRowSchema,
  uuidSchema,
} from "../schemas";
import { toFriend, toPublicUser } from "./mappers";

/** Search by username prefix (3 to 24 characters). Never returns the caller. */
export async function searchUsers(query: string): Promise<ActionResult<UserSearchResult[]>> {
  const q = searchQuerySchema.safeParse(query);
  if (!q.success)
    return fail({ code: "validation", message: q.error.issues[0]?.message ?? "Recherche invalide." });
  const { supabase, user } = await requireUser();

  // "_" is a LIKE wildcard: escape it so the prefix is literal.
  const pattern = `${q.data.replace(/_/g, "\\_")}%`;
  const [found, links] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).ilike("username", pattern).neq("id", user.id).limit(10),
    supabase.from("friendships").select("*"),
  ]);
  if (found.error || links.error)
    return fail({ code: "internal", message: "Recherche impossible pour le moment." });

  const byOther = new Map<string, { relation: Relation; friendshipId: string }>();
  for (const l of friendshipRowSchema.array().parse(links.data ?? [])) {
    const mine = l.requester_id === user.id;
    byOther.set(mine ? l.addressee_id : l.requester_id, {
      friendshipId: l.id,
      relation: l.status === "accepted" ? "friends" : mine ? "outgoing_pending" : "incoming_pending",
    });
  }
  return succeed(
    profileRowSchema
      .array()
      .parse(found.data ?? [])
      .map((p) => ({
        ...toPublicUser(p),
        relation: byOther.get(p.id)?.relation ?? "none",
        friendshipId: byOther.get(p.id)?.friendshipId ?? null,
      })),
  );
}

export async function sendFriendRequest(userId: string): Promise<ActionResult<FriendRequest>> {
  const id = uuidSchema.safeParse(userId);
  if (!id.success) return fail({ code: "validation", message: "Utilisateur invalide." });
  const { supabase, user } = await requireUser();
  if (id.data === user.id) return fail({ code: "forbidden", message: "Tu ne peux pas t'ajouter toi-même." });

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: id.data })
    .select("*")
    .single();
  if (error)
    return fail(
      toActionError(error, {
        "23505": "Une demande existe déjà avec cette personne.",
        "55000": "Une demande existe déjà avec cette personne.",
      }),
    );
  const row = friendshipRowSchema.parse(data);
  const { data: p } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id.data).single();
  const profile = profileRowSchema.safeParse(p);
  if (!profile.success) return fail({ code: "not_found", message: "Utilisateur introuvable." });
  refresh();
  return succeed({
    id: row.id,
    direction: "outgoing",
    user: toPublicUser(profile.data),
    createdAt: row.created_at,
  });
}

/** Only the addressee can accept or decline (RLS). Declining deletes the request. */
export async function respondFriendRequest(
  friendshipId: string,
  response: "accept" | "decline",
): Promise<ActionResult<Friend | null>> {
  const id = uuidSchema.safeParse(friendshipId);
  if (!id.success || (response !== "accept" && response !== "decline")) {
    return fail({ code: "validation", message: "Demande invalide." });
  }
  const { supabase, user } = await requireUser();

  if (response === "decline") {
    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", id.data)
      .eq("addressee_id", user.id)
      .eq("status", "pending")
      .select("id");
    if (error) return fail(toActionError(error));
    if (!data?.length) return fail({ code: "not_found", message: "Cette demande n'existe plus." });
    refresh();
    return succeed(null);
  }

  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id.data)
    .select("*");
  if (error) return fail(toActionError(error));
  const rows = friendshipRowSchema.array().parse(data ?? []);
  if (rows.length === 0) return fail({ code: "not_found", message: "Cette demande n'existe plus." });
  const row = rows[0]!;
  const [p, s] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", row.requester_id).single(),
    supabase
      .from("user_stats")
      .select("user_id, total_xp, current_streak, last_validated_on")
      .eq("user_id", row.requester_id)
      .maybeSingle(),
  ]);
  const profile = profileRowSchema.safeParse(p.data);
  if (!profile.success) return fail({ code: "not_found", message: "Utilisateur introuvable." });
  const stats = statsRowSchema.safeParse(s.data);
  refresh();
  return succeed(
    toFriend({
      friendshipId: row.id,
      since: row.responded_at ?? row.created_at,
      profile: profile.data,
      stats: stats.success ? stats.data : undefined,
      studyingNow: false,
      today: todayInParis(),
    }),
  );
}

/** Cancels a request the caller sent. */
export async function cancelFriendRequest(friendshipId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(friendshipId);
  if (!id.success) return fail({ code: "validation", message: "Demande invalide." });
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", id.data)
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .select("id");
  if (error) return fail(toActionError(error));
  if (!data?.length) return fail({ code: "not_found", message: "Cette demande n'existe plus." });
  refresh();
  return succeed(null);
}

export async function removeFriend(friendshipId: string): Promise<ActionResult<null>> {
  const id = uuidSchema.safeParse(friendshipId);
  if (!id.success) return fail({ code: "validation", message: "Ami invalide." });
  const { supabase } = await requireUser();
  // RLS: only the two participants can delete the row.
  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", id.data)
    .eq("status", "accepted")
    .select("id");
  if (error) return fail(toActionError(error));
  if (!data?.length) return fail({ code: "not_found", message: "Cet ami n'existe plus." });
  refresh();
  return succeed(null);
}

/** One "bravo" per person and per post. Toggles and returns the new state. */
export async function toggleReaction(postId: string): Promise<ActionResult<ReactionState>> {
  const id = uuidSchema.safeParse(postId);
  if (!id.success) return fail({ code: "validation", message: "Publication invalide." });
  const { supabase, user } = await requireUser();

  const existing = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", id.data)
    .eq("user_id", user.id);
  if (existing.error) return fail(toActionError(existing.error));
  const had = (existing.data?.length ?? 0) > 0;

  const { error } = had
    ? await supabase.from("post_reactions").delete().eq("post_id", id.data).eq("user_id", user.id)
    : await supabase.from("post_reactions").insert({ post_id: id.data });
  // A concurrent double click may hit the primary key: the state is then already "reacted".
  if (error && error.code !== "23505")
    return fail(toActionError(error, { "42501": "Tu ne peux pas réagir à cette publication." }));

  const { count } = await supabase
    .from("post_reactions")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", id.data);
  refresh();
  return succeed({ reactionsCount: count ?? 0, hasReacted: !had || !!error });
}
