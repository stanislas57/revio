import "server-only";
import { requireUser } from "@/lib/auth";
import { SESSION_COLUMNS, sessionRowSchema, type SessionRow } from "../schemas";

/** The caller's running session, if any (at most one, enforced in base). */
export async function getRunningSession(): Promise<SessionRow | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select(SESSION_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();
  if (error) throw new Error("Impossible de charger la séance en cours.");
  return data ? sessionRowSchema.parse(data) : null;
}

/** One of the caller's own sessions (RLS + explicit owner filter). */
export async function getOwnSession(id: string): Promise<SessionRow | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return null;
  return data ? sessionRowSchema.parse(data) : null;
}

export async function getRecentSessions(limit = 5): Promise<SessionRow[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("study_sessions")
    .select(SESSION_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Impossible de charger tes séances.");
  return sessionRowSchema.array().parse(data ?? []);
}
