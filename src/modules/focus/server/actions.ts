"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { sessionIdSchema, startSessionSchema } from "../schemas";

export type FocusActionState = { error?: string } | undefined;

export async function startSession(_prev: FocusActionState, formData: FormData): Promise<FocusActionState> {
  const parsed = startSessionSchema.safeParse({
    label: formData.get("label") ?? "",
    plannedMinutes: formData.get("plannedMinutes") ?? "",
    share: formData.get("share") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };

  const { supabase } = await requireUser();
  // started_at, status, results are set by the database (trigger), never by the client.
  const { error } = await supabase.from("study_sessions").insert({
    label: parsed.data.label,
    planned_minutes: parsed.data.plannedMinutes,
    visibility: parsed.data.share ? "friends" : "private",
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Une séance est déjà en cours."
          : "Impossible de démarrer la séance. Réessaie.",
    };
  }
  refresh();
}

async function callLifecycle(
  fn: "pause_study_session" | "resume_study_session" | "abandon_study_session",
  id: unknown,
) {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return { error: "Séance invalide." };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc(fn, { p_session_id: sessionId.data });
  if (error) return { error: "Action impossible : la séance a peut-être déjà changé d'état." };
  refresh();
  return undefined;
}

export async function pauseSession(id: string) {
  return callLifecycle("pause_study_session", id);
}

export async function resumeSession(id: string) {
  return callLifecycle("resume_study_session", id);
}

export async function abandonSession(id: string) {
  return callLifecycle("abandon_study_session", id);
}

/** Ends the session; XP and streak are computed by the database. */
export async function completeSession(id: string): Promise<FocusActionState> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return { error: "Séance invalide." };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("complete_study_session", { p_session_id: sessionId.data });
  if (error) return { error: "Impossible de terminer la séance. Réessaie." };
  redirect(`/focus/seance/${sessionId.data}`);
}

/** Owner chooses whether a session is shared in friends' feed. */
export async function setSessionVisibility(id: string, share: boolean): Promise<FocusActionState> {
  const sessionId = sessionIdSchema.safeParse(id);
  if (!sessionId.success) return { error: "Séance invalide." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("study_sessions")
    .update({ visibility: share ? "friends" : "private" })
    .eq("id", sessionId.data)
    .eq("user_id", user.id);
  if (error) return { error: "Modification impossible." };
  refresh();
}
