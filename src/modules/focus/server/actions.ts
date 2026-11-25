"use server";

import { refresh } from "next/cache";
import type { ActionResult } from "@/lib/contracts";
import { fail, fromDbError, ok } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import type { ActiveSession, SessionResult, StartSessionInput } from "../contracts";
import { sessionIdSchema, sessionRowSchema, startSessionSchema, storedResultSchema } from "../schemas";
import { toActiveSession, toSessionResult } from "./mappers";

export async function startSession(input: StartSessionInput): Promise<ActionResult<ActiveSession>> {
  const parsed = startSessionSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      "validation",
      issue?.message ?? "Données invalides.",
      issue ? { [String(issue.path[0] ?? "")]: issue.message } : undefined,
    );
  }
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("start_study_session", {
    p_mode: parsed.data.mode,
    p_subject_id: parsed.data.subjectId ?? null,
    p_planned_minutes: parsed.data.plannedMinutes ?? null,
    p_visibility: parsed.data.visibility ?? "friends",
  });
  if (error) return fromDbError(error, { conflict: "Une séance est déjà en cours." });
  let row = sessionRowSchema.safeParse(data);
  if (!row.success) return fail("internal", "Réponse inattendue du serveur.");
  if (parsed.data.label) {
    const labelled = await supabase.rpc("set_study_session_label", {
      p_session_id: row.data.id,
      p_label: parsed.data.label,
    });
    if (!labelled.error) row = sessionRowSchema.safeParse(labelled.data);
    if (!row.success) return fail("internal", "Réponse inattendue du serveur.");
  }
  refresh();
  return ok(toActiveSession(row.data));
}

async function lifecycle(fn: "pause_study_session" | "resume_study_session", id: string) {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return fail("validation", "Séance invalide.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(fn, { p_session_id: sessionId.data });
  if (error) return fromDbError(error);
  const row = sessionRowSchema.safeParse(data);
  if (!row.success) return fail("internal", "Réponse inattendue du serveur.");
  refresh();
  return ok(toActiveSession(row.data));
}

export async function pauseSession(id: string): Promise<ActionResult<ActiveSession>> {
  return lifecycle("pause_study_session", id);
}

export async function resumeSession(id: string): Promise<ActionResult<ActiveSession>> {
  return lifecycle("resume_study_session", id);
}

/** Keeps the session "online" for friends; call every 60 s while the tab is visible. */
export async function heartbeatSession(id: string): Promise<ActionResult<null>> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return fail("validation", "Séance invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("heartbeat_study_session", { p_session_id: sessionId.data });
  return error ? fromDbError(error) : ok(null);
}

/** No XP, no post. */
export async function cancelSession(id: string): Promise<ActionResult<null>> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return fail("validation", "Séance invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("cancel_study_session", { p_session_id: sessionId.data });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}

/** Ends the session; XP, streak and post are computed by the database. Replaying returns the same result. */
export async function finishSession(id: string): Promise<ActionResult<SessionResult>> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return fail("validation", "Séance invalide.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("finalize_study_session", { p_session_id: sessionId.data });
  if (error) return fromDbError(error, { conflict: "Cette séance a été annulée." });
  const stored = storedResultSchema.safeParse(data);
  if (!stored.success) return fail("internal", "Réponse inattendue du serveur.");
  refresh();
  return ok(toSessionResult(stored.data));
}

/** The owner may share or hide a session at any time (the post follows). */
export async function setSessionVisibility(id: string, shared: boolean): Promise<ActionResult<null>> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return fail("validation", "Séance invalide.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_study_session_visibility", {
    p_session_id: sessionId.data,
    p_visibility: shared ? "friends" : "private",
  });
  if (error) return fromDbError(error);
  refresh();
  return ok(null);
}
