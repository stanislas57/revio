import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { ActiveSession, SessionResult } from "../contracts";
import { toSessionResult } from "../domain/session-result";
import { SESSION_COLUMNS, toActiveSession, type SubjectRef } from "../domain/session-row";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

export async function loadSubject(supabase: Client, subjectId: string | null): Promise<SubjectRef | null> {
  if (!subjectId) return null;
  const { data } = await supabase
    .from("subjects")
    .select("id, name, color")
    .eq("id", subjectId)
    .maybeSingle();
  return (data as SubjectRef | null) ?? null;
}

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
  if (!data) return null;
  const subject = await loadSubject(supabase, (data as { subject_id: string | null }).subject_id);
  return toActiveSession(data, subject, new Date().toISOString());
}

export type RecentSession = {
  id: string;
  subjectName: string | null;
  endedAt: string;
  durationMinutes: number;
  earnedXp: number;
};

const recentSchema = z.object({
  id: z.string(),
  ended_at: z.string(),
  result: z.object({
    subject_name: z.string().nullable(),
    duration_minutes: z.number(),
    earned_xp: z.number(),
  }),
});

/** The caller's last finished sessions with the XP they earned (from the stored summary). */
export async function getRecentSessions(limit = 5): Promise<RecentSession[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, ended_at, result")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .not("result", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Impossible de charger tes séances.");
  const parsed = z.array(recentSchema).safeParse(data ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((r) => ({
    id: r.id,
    subjectName: r.result.subject_name,
    endedAt: r.ended_at,
    durationMinutes: r.result.duration_minutes,
    earnedXp: r.result.earned_xp,
  }));
}

/** Official summary of one of the caller's finished sessions, "running" while it is not finished, or null. */
export async function getSessionResult(id: string): Promise<SessionResult | "running" | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("status, result")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status === "in_progress") return "running";
  try {
    return toSessionResult({ ...(data.result as object), already_finalized: true });
  } catch {
    return null;
  }
}

/** The caller's subjects, to pick one when starting a session (private: RLS owner only). */
export async function listMySubjects(): Promise<SubjectRef[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("subjects").select("id, name, color").order("name");
  if (error) return [];
  const parsed = z
    .array(z.object({ id: z.string(), name: z.string(), color: z.string().nullable() }))
    .safeParse(data ?? []);
  return parsed.success ? parsed.data : [];
}
