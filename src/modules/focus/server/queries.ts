import "server-only";
import { requireUser } from "@/lib/auth";
import type { ActiveSession } from "../contracts";
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
