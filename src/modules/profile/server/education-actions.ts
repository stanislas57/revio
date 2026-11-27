"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import {
  educationAnswersSchema,
  educationDetailsSchema,
  type EducationAnswers,
  type EducationDetails,
} from "../domain/education";
import { logEducationError } from "./education-log";

function invalid(message?: string) {
  return fail<never>({ code: "validation", message: message ?? "Données invalides." });
}

/** End of the onboarding: saves the answers (each one may be empty) and never shows the onboarding again. */
export async function saveOnboardingAnswers(input: EducationAnswers): Promise<ActionResult<null>> {
  const parsed = educationAnswersSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_education").upsert(
    {
      user_id: user.id,
      school_id: parsed.data.schoolId,
      study_level: parsed.data.studyLevel,
      gender: parsed.data.gender,
      onboarding_done: true,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logEducationError("save onboarding answers", error);
    return fail(toActionError(error, { "23503": "École inconnue." }));
  }
  refresh();
  return succeed(null);
}

/** "Mes informations": the study level and the gender (null erases an answer). The school is left as it is. */
export async function saveEducationDetails(input: EducationDetails): Promise<ActionResult<null>> {
  const parsed = educationDetailsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_education").upsert(
    {
      user_id: user.id,
      study_level: parsed.data.studyLevel,
      gender: parsed.data.gender,
      onboarding_done: true,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logEducationError("save education details", error);
    return fail(toActionError(error));
  }
  refresh();
  return succeed(null);
}
