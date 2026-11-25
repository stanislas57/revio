import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/modules/profile/server/queries";
import { todayIso } from "../domain/dates";
import { GRADE_KINDS, type AcademicSnapshot, type Grade, type Subject } from "../domain/types";

const subjectRow = z.object({
  id: z.string(),
  name: z.string(),
  coefficient: z.coerce.number(),
  color: z.string().nullable(),
  teaching_unit: z.string().nullable(),
  semester: z.string().nullable(),
  target_average: z.coerce.number().nullable(),
  archived_at: z.string().nullable(),
  is_template: z.boolean(),
  created_at: z.string(),
});
const gradeRow = z.object({
  id: z.string(),
  subject_id: z.string(),
  label: z.string().nullable(),
  value: z.coerce.number(),
  max_value: z.coerce.number(),
  coefficient: z.coerce.number(),
  graded_on: z.string().nullable(),
  kind: z.enum(GRADE_KINDS),
});
const examRow = z.object({
  id: z.string(),
  subject_id: z.string().nullable(),
  title: z.string(),
  exam_on: z.string(),
});
const settingsRow = z.object({ target_average: z.coerce.number().nullable() });

/** Everything the academic screens need, in parallel queries (RLS: owner only). */
export async function getAcademicSnapshot(): Promise<AcademicSnapshot> {
  const { supabase, user } = await requireUser();
  const [subjects, grades, exams, settings, profileSettings] = await Promise.all([
    supabase
      .from("subjects")
      .select(
        "id, name, coefficient, color, teaching_unit, semester, target_average, archived_at, is_template, created_at",
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("grades")
      .select("id, subject_id, label, value, max_value, coefficient, graded_on, kind")
      .order("graded_on", { ascending: true, nullsFirst: true }),
    supabase.from("exams").select("id, subject_id, title, exam_on").order("exam_on", { ascending: true }),
    supabase.from("academic_settings").select("target_average").eq("user_id", user.id).maybeSingle(),
    // timezone only; the helper falls back to Europe/Paris
    loadSettings(supabase, user.id),
  ]);
  if (subjects.error || grades.error || exams.error || settings.error) {
    throw new Error("Impossible de charger tes matières et tes notes.");
  }

  const gradesBySubject = new Map<string, Grade[]>();
  for (const row of z.array(gradeRow).parse(grades.data ?? [])) {
    const list = gradesBySubject.get(row.subject_id) ?? [];
    list.push({
      id: row.id,
      subjectId: row.subject_id,
      label: row.label,
      value: row.value,
      maxValue: row.max_value,
      coefficient: row.coefficient,
      gradedOn: row.graded_on,
      kind: row.kind,
    });
    gradesBySubject.set(row.subject_id, list);
  }

  const parsedSettings = settingsRow.safeParse(settings.data);
  return {
    subjects: z
      .array(subjectRow)
      .parse(subjects.data ?? [])
      .map((row): Subject => ({
        id: row.id,
        name: row.name,
        coefficient: row.coefficient,
        color: row.color,
        teachingUnit: row.teaching_unit,
        semester: row.semester,
        targetAverage: row.target_average,
        archived: row.archived_at !== null,
        isTemplate: row.is_template,
        grades: gradesBySubject.get(row.id) ?? [],
      })),
    exams: z
      .array(examRow)
      .parse(exams.data ?? [])
      .map((row) => ({
        id: row.id,
        subjectId: row.subject_id,
        title: row.title,
        examOn: row.exam_on,
      })),
    targetAverage: parsedSettings.success ? parsedSettings.data.target_average : null,
    today: todayIso(profileSettings.timezone),
  };
}
