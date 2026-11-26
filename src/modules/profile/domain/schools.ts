import { z } from "zod";

export const SCHOOL_KINDS = ["lycee", "lycee_pro", "universite", "ecole"] as const;
export type SchoolKind = (typeof SCHOOL_KINDS)[number];

export const SCHOOL_KIND_LABELS: Record<SchoolKind, string> = {
  lycee: "Lycée général et technologique",
  lycee_pro: "Lycée professionnel",
  universite: "Université",
  ecole: "École ou grand établissement",
};

export type School = {
  id: string;
  name: string;
  kind: SchoolKind;
  isPublic: boolean | null;
  city: string | null;
  postalCode: string | null;
  department: string | null;
};

/**
 * Lowercase, no accents, words separated by one space. The database stores the same form of every school
 * (scripts/build-schools-migration.mjs), so a search matches whatever the accents or capitals typed.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const MIN_QUERY_LENGTH = 2;

export const schoolSearchSchema = z.object({
  query: z
    .string()
    .max(80, { error: "Recherche trop longue." })
    .transform(normalizeSearch)
    .refine((q) => q.length >= MIN_QUERY_LENGTH, { error: `Tape au moins ${MIN_QUERY_LENGTH} lettres.` }),
  kind: z.enum(SCHOOL_KINDS).nullable().default(null),
});
export type SchoolSearchInput = z.input<typeof schoolSearchSchema>;

/** `schoolId: null` removes the choice. UAI codes are letters and digits, 3 to 20 characters. */
export const mySchoolSchema = z.object({
  schoolId: z
    .string()
    .regex(/^[A-Za-z0-9]{3,20}$/, { error: "École inconnue." })
    .nullable(),
});

export function describeSchool(s: Pick<School, "city" | "department" | "isPublic">): string {
  const place = [s.city, s.department].filter(Boolean).join(", ");
  const status = s.isPublic === null ? "" : s.isPublic ? "public" : "privé";
  return [place, status].filter(Boolean).join(" · ");
}
