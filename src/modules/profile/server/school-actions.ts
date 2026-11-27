"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { mySchoolSchema, schoolSearchSchema, type School, type SchoolSearchInput } from "../domain/schools";
import { logEducationError } from "./education-log";
import { schoolRowSchema, toSchool } from "./school";

function firstIssue(error: z.ZodError) {
  return fail<never>({ code: "validation", message: error.issues[0]?.message ?? "Données invalides." });
}

/** Searches the schools of France by words (name, city, postcode, department), 20 at most. */
export async function searchSchools(input: SchoolSearchInput): Promise<ActionResult<School[]>> {
  const parsed = schoolSearchSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("search_schools", {
    p_query: parsed.data.query,
    p_kind: parsed.data.kind,
    p_limit: 20,
  });
  if (error) {
    logEducationError("search schools", error);
    return fail(toActionError(error));
  }
  const rows = z.array(schoolRowSchema).safeParse(data ?? []);
  if (!rows.success) return fail({ code: "internal", message: "Réponse inattendue. Réessaie." });
  return succeed(rows.data.map(toSchool));
}

/** Saves (or clears, with `null`) the caller's school and marks the first-run card as done. */
export async function saveMySchool(input: { schoolId: string | null }): Promise<ActionResult<null>> {
  const parsed = mySchoolSchema.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error);
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_education")
    .upsert(
      { user_id: user.id, school_id: parsed.data.schoolId, onboarding_done: true },
      { onConflict: "user_id" },
    );
  if (error) {
    logEducationError("save school", error);
    return fail(toActionError(error, { "23503": "École inconnue." }));
  }
  refresh();
  return succeed(null);
}

/** "Plus tard": the first-run card is not shown again. The school stays as it is. */
export async function skipOnboarding(): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_education")
    .upsert({ user_id: user.id, onboarding_done: true }, { onConflict: "user_id" });
  if (error) {
    logEducationError("skip onboarding", error);
    return fail(toActionError(error));
  }
  refresh();
  return succeed(null);
}
