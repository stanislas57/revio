import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  feedItemSchema,
  friendOverviewSchema,
  friendshipRowSchema,
  publicProfileSchema,
  searchQuerySchema,
  type FeedItemRow,
  type FriendOverview,
  type PublicProfile,
} from "../schemas";

export type FeedItem = Omit<FeedItemRow, "session_reactions"> & {
  reactionCount: number;
  reactedByMe: boolean;
  isMine: boolean;
};

/** Completed sessions visible to the caller (own + friends' shared ones, via RLS). */
export async function getFeed(limit = 30): Promise<FeedItem[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select(
      "id, user_id, label, duration_minutes, xp_awarded, streak_days, ended_at, profiles(username, display_name, avatar_url), session_reactions(user_id)",
    )
    .eq("status", "completed")
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Impossible de charger le fil.");
  return feedItemSchema
    .array()
    .parse(data ?? [])
    .map(({ session_reactions, ...item }) => ({
      ...item,
      reactionCount: session_reactions.length,
      reactedByMe: session_reactions.some((r) => r.user_id === user.id),
      isMine: item.user_id === user.id,
    }));
}

/** Accepted friends with XP, streak and live session (SQL function, caller-scoped). */
export async function getFriendsOverview(): Promise<FriendOverview[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("get_friends_overview");
  if (error) throw new Error("Impossible de charger tes amis.");
  return friendOverviewSchema.array().parse(data ?? []);
}

export type FriendRequest = { id: string; profile: PublicProfile };

/** Pending requests received and sent by the caller. */
export async function getFriendRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, requester_id, addressee_id, status, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)",
    )
    .eq("status", "pending");
  if (error) throw new Error("Impossible de charger les demandes.");
  const rows = friendshipRowSchema.array().parse(data ?? []);
  return {
    received: rows.filter((r) => r.addressee_id === user.id).map((r) => ({ id: r.id, profile: r.requester })),
    sent: rows.filter((r) => r.requester_id === user.id).map((r) => ({ id: r.id, profile: r.addressee })),
  };
}

export type SearchResult = PublicProfile & { relation: "none" | "friend" | "sent" | "received" };

/** Find users by username prefix or display name, excluding the caller. */
export async function searchProfiles(rawQuery: string): Promise<SearchResult[] | { error: string }> {
  const parsed = searchQuerySchema.safeParse(rawQuery);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Recherche invalide." };
  const q = parsed.data;
  if (q.length < 2) return [];

  const { supabase, user } = await requireUser();
  const [{ data, error }, { data: links }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.${q.toLowerCase()}%,display_name.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(10),
    supabase.from("friendships").select("requester_id, addressee_id, status"),
  ]);
  if (error) return { error: "Recherche impossible pour le moment." };

  const relations = new Map<string, SearchResult["relation"]>();
  const linkRows = z
    .array(z.object({ requester_id: z.string(), addressee_id: z.string(), status: z.string() }))
    .parse(links ?? []);
  for (const l of linkRows) {
    const other = l.requester_id === user.id ? l.addressee_id : l.requester_id;
    relations.set(
      other,
      l.status === "accepted" ? "friend" : l.requester_id === user.id ? "sent" : "received",
    );
  }
  return publicProfileSchema
    .array()
    .parse(data ?? [])
    .map((p) => ({ ...p, relation: relations.get(p.id) ?? "none" }));
}
