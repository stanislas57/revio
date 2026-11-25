"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { TEMPLATES } from "../domain/templates";
import { examSchema, gradeSchema, idSchema, subjectSchema, targetSchema } from "../schemas";
import type { ExamInput, GradeFormInput, SubjectInput } from "../schemas";
import { validate } from "./validate";

type Done = ActionResult<{ id: string }>;

function done(id: string): Done {
  refresh();
  return succeed({ id });
}

function subjectColumns(d: ReturnType<typeof subjectSchema.parse>) {
  return {
    name: d.name,
    coefficient: d.coefficient,
    teaching_unit: d.teachingUnit,
    semester: d.semester,
    target_average: d.targetAverage,
  };
}

export async function addSubject(input: SubjectInput): Promise<Done> {
  const v = validate(subjectSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("subjects")
    .insert(subjectColumns(v.data))
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

export async function updateSubject(id: string, input: SubjectInput): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const v = validate(subjectSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  // A subject edited by hand is no longer an untouched template subject.
  const { data, error } = await supabase
    .from("subjects")
    .update({ ...subjectColumns(v.data), is_template: false })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

export async function setSubjectArchived(id: string, archived: boolean): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("subjects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

/** Deletes the subject and (cascade) its grades. Irreversible: the UI asks for confirmation. */
export async function deleteSubject(id: string): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return fail(toActionError(error));
  return done(id);
}

function gradeColumns(d: ReturnType<typeof gradeSchema.parse>) {
  return {
    label: d.label,
    value: d.value,
    max_value: d.maxValue,
    coefficient: d.coefficient,
    graded_on: d.gradedOn,
    kind: d.kind,
  };
}

export async function addGrade(input: GradeFormInput): Promise<Done> {
  const v = validate(gradeSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("grades")
    .insert({ subject_id: v.data.subjectId, ...gradeColumns(v.data) })
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

export async function updateGrade(id: string, input: GradeFormInput): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const v = validate(gradeSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("grades")
    .update(gradeColumns(v.data))
    .eq("id", id)
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

export async function deleteGrade(id: string): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("grades").delete().eq("id", id);
  if (error) return fail(toActionError(error));
  return done(id);
}

export async function addExam(input: ExamInput): Promise<Done> {
  const v = validate(examSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("exams")
    .insert({ subject_id: v.data.subjectId, title: v.data.title, exam_on: v.data.examOn })
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  return done(String(data.id));
}

export async function deleteExam(id: string): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return fail(toActionError(error));
  return done(id);
}

/** Overall target average (/20); `null` clears it. */
export async function setTargetAverage(
  value: number | null,
): Promise<ActionResult<{ target: number | null }>> {
  const v = validate(targetSchema, value);
  if (!v.ok) return v.result;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("academic_settings")
    .upsert({ user_id: user.id, target_average: v.data }, { onConflict: "user_id" });
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ target: v.data });
}

/**
 * Creates the subjects of a sample template (editable examples, NOT an official
 * curriculum). Refused when the user already has subjects, to avoid duplicates.
 */
export async function importTemplate(key: string): Promise<ActionResult<{ count: number }>> {
  const template = Object.hasOwn(TEMPLATES, key) ? TEMPLATES[key] : undefined;
  if (!template) return fail({ code: "not_found", message: "Modèle inconnu." });
  const { supabase } = await requireUser();
  const existing = await supabase.from("subjects").select("id", { count: "exact", head: true });
  if (existing.error) return fail(toActionError(existing.error));
  if ((existing.count ?? 0) > 0) {
    return fail({
      code: "conflict",
      message: "Tu as déjà des matières : l'import d'un modèle n'est possible que sur un compte vide.",
    });
  }
  const { error } = await supabase.from("subjects").insert(
    template.subjects.map((s) => ({
      name: s.name,
      coefficient: s.coefficient,
      color: s.color,
      teaching_unit: s.teachingUnit,
      semester: template.semester,
      is_template: true,
    })),
  );
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ count: template.subjects.length });
}
