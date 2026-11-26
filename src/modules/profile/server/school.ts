import "server-only";
import { z } from "zod";
import type { requireUser } from "@/lib/auth";
import type { School } from "../domain/schools";
import { SCHOOL_KINDS } from "../domain/schools";

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

export type MyEducation = { school: School | null; onboardingDone: boolean };

/** The caller's school and whether the first-run card is done (owner-only table). */
export async function loadMyEducation(supabase: Client, userId: string): Promise<MyEducation> {
  const { data } = await supabase
    .from("user_education")
    .select("school_id, onboarding_done")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { school: null, onboardingDone: false };
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
  return { school, onboardingDone: data.onboarding_done === true };
}
