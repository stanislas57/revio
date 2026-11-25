import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { today as todayInParis } from "@/modules/gamification/domain/streak-display";
import type { FeedPage, FeedPost, Friend, FriendRequest, LiveFriend } from "../contracts";
import {
  PROFILE_COLUMNS,
  feedInputSchema,
  friendshipRowSchema,
  liveRowSchema,
  postRowSchema,
  reactionRowSchema,
  profileRowSchema,
  statsRowSchema,
} from "../schemas";
import { toFriend, toPublicUser } from "./mappers";

/** A shared session without heartbeat for 3 minutes is considered offline (decision D-19). */
const ONLINE_WINDOW_MS = 3 * 60_000;

async function loadProfiles(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], ids: string[]) {
  if (ids.length === 0) return new Map<string, z.infer<typeof profileRowSchema>>();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  if (error) throw new Error("Impossible de charger les profils.");
  return new Map(
    profileRowSchema
      .array()
      .parse(data ?? [])
      .map((p) => [p.id, p]),
  );
}

async function liveUserIds(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], ids: string[]) {
  if (ids.length === 0) return [];
  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("user_id")
    .in("user_id", ids)
    .eq("status", "in_progress")
    .eq("visibility", "friends")
    .gte("last_heartbeat_at", since);
  if (error) throw new Error("Impossible de charger les amis en révision.");
  return z
    .array(z.object({ user_id: z.string() }))
    .parse(data ?? [])
    .map((r) => r.user_id);
}

/** Accepted friends with level, streak and live status. */
export async function listFriends(): Promise<Friend[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("friendships").select("*").eq("status", "accepted");
  if (error) throw new Error("Impossible de charger tes amis.");
  const rows = friendshipRowSchema.array().parse(data ?? []);
  const otherId = (r: (typeof rows)[number]) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id;
  const ids = rows.map(otherId);
  if (ids.length === 0) return [];

  const [profiles, statsRes, live] = await Promise.all([
    loadProfiles(supabase, ids),
    supabase
      .from("user_stats")
      .select("user_id, total_xp, current_streak, last_validated_on")
      .in("user_id", ids),
    liveUserIds(supabase, ids),
  ]);
  if (statsRes.error) throw new Error("Impossible de charger les statistiques.");
  const stats = new Map(
    statsRowSchema
      .array()
      .parse(statsRes.data ?? [])
      .map((s) => [s.user_id, s]),
  );
  const liveSet = new Set(live);
  const today = todayInParis();

  return rows.flatMap((r) => {
    const profile = profiles.get(otherId(r));
    if (!profile) return [];
    return [
      toFriend({
        friendshipId: r.id,
        since: r.responded_at ?? r.created_at,
        profile,
        stats: stats.get(profile.id),
        studyingNow: liveSet.has(profile.id),
        today,
      }),
    ];
  });
}

/** Pending requests received and sent by the caller. */
export async function listFriendRequests(): Promise<FriendRequest[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les demandes.");
  const rows = friendshipRowSchema.array().parse(data ?? []);
  const otherId = (r: (typeof rows)[number]) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id;
  const profiles = await loadProfiles(supabase, rows.map(otherId));
  return rows.flatMap((r) => {
    const profile = profiles.get(otherId(r));
    if (!profile) return [];
    return [
      {
        id: r.id,
        direction: r.addressee_id === user.id ? ("incoming" as const) : ("outgoing" as const),
        user: toPublicUser(profile),
        createdAt: r.created_at,
      },
    ];
  });
}

/** Friends currently in a shared session (online = heartbeat within 3 min). */
export async function getLiveFriends(): Promise<LiveFriend[]> {
  const { supabase, user } = await requireUser();
  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, user_id, started_at, paused_at, paused_seconds")
    .neq("user_id", user.id)
    .eq("status", "in_progress")
    .eq("visibility", "friends")
    .gte("last_heartbeat_at", since)
    .order("started_at", { ascending: true });
  if (error) throw new Error("Impossible de charger les amis en révision.");
  const rows = liveRowSchema.array().parse(data ?? []);
  const profiles = await loadProfiles(
    supabase,
    rows.map((r) => r.user_id),
  );
  const serverNow = new Date().toISOString();
  return rows.flatMap((r) => {
    const profile = profiles.get(r.user_id);
    if (!profile) return [];
    return [
      {
        user: toPublicUser(profile),
        sessionId: r.id,
        status: r.paused_at ? ("paused" as const) : ("running" as const),
        startedAt: r.started_at,
        pausedAt: r.paused_at,
        pausedSeconds: r.paused_seconds,
        // D-16: friends never see a subject (private table); only posts may carry it, with opt-in.
        subjectName: null,
        serverNow,
      },
    ];
  });
}

/** Posts of the caller and their friends (RLS decides), newest first. */
export async function getFeed(input: { cursor?: string; limit?: number } = {}): Promise<FeedPage> {
  const parsed = feedInputSchema.safeParse(input);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const cursor = parsed.success ? parsed.data.cursor : undefined;
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("posts")
    .select("id, user_id, type, subject_name, duration_minutes, earned_xp, streak_days, created_at")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (cursor && !Number.isNaN(Date.parse(cursor))) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger le fil.");
  const rows = postRowSchema.array().parse(data ?? []);
  const page = rows.slice(0, limit);
  const profiles = await loadProfiles(supabase, [...new Set(page.map((r) => r.user_id))]);

  // Reactions in a second query (RLS: only those on posts the caller can read).
  const reactionsByPost = new Map<string, string[]>();
  if (page.length > 0) {
    const { data: reactionData, error: reactionError } = await supabase
      .from("post_reactions")
      .select("post_id, user_id")
      .in(
        "post_id",
        page.map((r) => r.id),
      );
    if (reactionError) throw new Error("Impossible de charger les réactions.");
    for (const r of reactionRowSchema.array().parse(reactionData ?? [])) {
      reactionsByPost.set(r.post_id, [...(reactionsByPost.get(r.post_id) ?? []), r.user_id]);
    }
  }

  const posts = page.flatMap((r): FeedPost[] => {
    const author = profiles.get(r.user_id);
    if (!author) return [];
    return [
      {
        id: r.id,
        type: r.type,
        author: toPublicUser(author),
        isMine: r.user_id === user.id,
        createdAt: r.created_at,
        subjectName: r.subject_name,
        durationMinutes: r.duration_minutes,
        earnedXp: r.earned_xp,
        streakDays: r.streak_days,
        reactionsCount: (reactionsByPost.get(r.id) ?? []).length,
        hasReacted: (reactionsByPost.get(r.id) ?? []).includes(user.id),
      },
    ];
  });
  return { posts, nextCursor: rows.length > limit ? (page.at(-1)?.created_at ?? null) : null };
}
