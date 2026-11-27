import "server-only";
import { z } from "zod";
import type { requireUser } from "@/lib/auth";
import { GENDERS, STUDY_LEVELS, type Gender, type StudyLevel } from "../domain/education";
import type { School } from "../domain/schools";
import { SCHOOL_KINDS } from "../domain/schools";
import { logEducationError } from "./education-log";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

export const schoolRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(SCHOOL_KINDS),
  is_public: z.boolean().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  department: z.string().nullable(),
});

export function toSchool(row: z.infer<typeof schoolRowSchema>): School {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    isPublic: row.is_public,
    city: row.city,
    postalCode: row.postal_code,
    department: row.department,
  };
}

export type MyEducation = {
  school: School | null;
  studyLevel: StudyLevel | null;
  gender: Gender | null;
  onboardingDone: boolean;
  /** The read failed (database error): nothing is known, which is NOT the same as « onboarding not done ». */
  unavailable: boolean;
};

const studyLevelSchema = z.enum(STUDY_LEVELS).nullable().catch(null);
const genderSchema = z.enum(GENDERS).nullable().catch(null);

/**
 * The caller's school, study level, gender and whether the onboarding is done (owner-only table).
 * A read error (for example a column the database does not have yet) is reported with `unavailable: true` and
 * logged; it is never turned into « onboarding not done », which would shut the person out of the app.
 */
export async function loadMyEducation(supabase: Client, userId: string): Promise<MyEducation> {
  const { data, error } = await supabase
    .from("user_education")
    .select("school_id, study_level, gender, onboarding_done")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logEducationError("read user_education", error);
    return { school: null, studyLevel: null, gender: null, onboardingDone: false, unavailable: true };
  }
  if (!data)
    return { school: null, studyLevel: null, gender: null, onboardingDone: false, unavailable: false };
  let school: School | null = null;
  if (typeof data.school_id === "string") {
    const { data: row } = await supabase
      .from("schools")
      .select("id, name, kind, is_public, city, postal_code, department")
      .eq("id", data.school_id)
      .maybeSingle();
    const parsed = schoolRowSchema.safeParse(row);
    school = parsed.success ? toSchool(parsed.data) : null;
  }
  return {
    school,
    studyLevel: studyLevelSchema.parse(data.study_level ?? null),
    gender: genderSchema.parse(data.gender ?? null),
    onboardingDone: data.onboarding_done === true,
    unavailable: false,
  };
}
