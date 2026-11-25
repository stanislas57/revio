"use server";

import { z } from "zod";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import type { ActiveSession, SessionResult, StartSessionInput } from "../contracts";
import { toActiveSession } from "../domain/session-row";
import { toSessionResult } from "../domain/session-result";
import { loadSubject } from "./queries";

// Every timestamp is set by the database (decision D-17): these actions only
// call the SQL functions, never write study_sessions directly.

const startSchema = z
  .object({
    mode: z.enum(["free", "countdown", "pomodoro"]),
    subjectId: z.uuid().optional(),
    plannedMinutes: z.number().int().min(1).max(600).optional(),
    visibility: z.enum(["private", "friends"]).optional(),
  })
  .refine((v) => v.mode === "free" || v.plannedMinutes !== undefined, {
    message: "Indique une durée pour le compte à rebours.",
    path: ["plannedMinutes"],
  });

const idSchema = z.uuid();

const MESSAGES = {
  "23505": "Une séance est déjà en cours.",
  "23503": "Cette matière n'existe pas.",
  P0002: "Séance introuvable.",
};

type Rpc = "pause_study_session" | "resume_study_session" | "cancel_study_session";

async function transition(fn: Rpc, sessionId: unknown): Promise<ActionResult<ActiveSession | null>> {
  const id = idSchema.safeParse(sessionId);
  if (!id.success) return fail({ code: "validation", message: "Séance invalide." });
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(fn, { p_session_id: id.data });
  if (error) return fail(toActionError(error, MESSAGES));
  const subject = await loadSubject(supabase, (data as { subject_id: string | null }).subject_id);
  return succeed(toActiveSession(data, subject, new Date().toISOString()));
}

export async function startSession(input: StartSessionInput): Promise<ActionResult<ActiveSession>> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) {
    return fail({ code: "validation", message: parsed.error.issues[0]?.message ?? "Données invalides." });
  }
  const { supabase } = await requireUser();
  const { mode, subjectId, plannedMinutes, visibility } = parsed.data;
  const { data, error } = await supabase.rpc("start_study_session", {
    p_mode: mode,
    p_subject_id: subjectId ?? null,
    p_planned_minutes: plannedMinutes ?? null,
    p_visibility: visibility ?? "friends",
  });
  if (error) return fail(toActionError(error, MESSAGES));
  const subject = await loadSubject(supabase, subjectId ?? null);
  const session = toActiveSession(data, subject, new Date().toISOString());
  if (!session) return fail({ code: "internal", message: "La séance n'a pas pu démarrer." });
  return succeed(session);
}

export async function pauseSession(sessionId: string) {
  return transition("pause_study_session", sessionId);
}

export async function resumeSession(sessionId: string) {
  return transition("resume_study_session", sessionId);
}

export async function cancelSession(sessionId: string): Promise<ActionResult<null>> {
  const result = await transition("cancel_study_session", sessionId);
  return result.ok ? succeed(null) : result;
}

/** Call every 60 s while the Focus tab is visible. */
export async function heartbeatSession(sessionId: string): Promise<ActionResult<null>> {
  const id = idSchema.safeParse(sessionId);
  if (!id.success) return fail({ code: "validation", message: "Séance invalide." });
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("heartbeat_study_session", { p_session_id: id.data });
  return error ? fail(toActionError(error, MESSAGES)) : succeed(null);
}

/** Idempotent: calling it again returns the same summary with alreadyFinalized = true. */
export async function finishSession(sessionId: string): Promise<ActionResult<SessionResult>> {
  const id = idSchema.safeParse(sessionId);
  if (!id.success) return fail({ code: "validation", message: "Séance invalide." });
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("finish_study_session", { p_session_id: id.data });
  if (error) return fail(toActionError(error, { ...MESSAGES, "55000": "Cette séance a été annulée." }));
  try {
    return succeed(toSessionResult(data));
  } catch {
    return fail({ code: "internal", message: "Récapitulatif de séance illisible." });
  }
}
