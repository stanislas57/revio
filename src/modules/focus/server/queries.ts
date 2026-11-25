import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { ActiveSession, SessionResult } from "../contracts";
import { SESSION_COLUMNS, sessionRowSchema, storedResultSchema, type SessionRow } from "../schemas";
import { toActiveSession, toSessionResult } from "./mappers";

/** The caller's running or paused session, or null. */
export async function getActiveSession(): Promise<ActiveSession | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select(SESSION_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();
  if (error) throw new Error("Impossible de charger la séance en cours.");
  return data ? toActiveSession(sessionRowSchema.parse(data)) : null;
}

export type RecentSession = {
  id: string;
  label: string | null;
  endedAt: string;
  durationMinutes: number;
  earnedXp: number;
};

/** The caller's last completed sessions, with the XP they earned. */
export async function getRecentSessions(limit = 5): Promise<RecentSession[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, label, ended_at, result")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .not("result", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Impossible de charger tes séances.");
  const rows = z
    .array(
      z.object({
        id: z.string(),
        label: z.string().nullable(),
        ended_at: z.string(),
        result: storedResultSchema,
      }),
    )
    .parse(data ?? []);
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    endedAt: r.ended_at,
    durationMinutes: r.result.durationMinutes,
    earnedXp: r.result.earnedXp,
  }));
}

/** Official result of one of the caller's finalized sessions, plus its visibility. */
export async function getSessionResult(
  id: string,
): Promise<{ result: SessionResult; shared: boolean } | "running" | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("status, visibility, result")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status === "in_progress") return "running";
  const stored = storedResultSchema.safeParse(data.result);
  if (!stored.success) return null;
  return {
    result: toSessionResult({ ...stored.data, alreadyFinalized: true }),
    shared: data.visibility === "friends",
  };
}

export type { SessionRow };
