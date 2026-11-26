"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import {
  MAX_GRADES_PER_SUBJECT,
  MAX_SUBJECTS,
  parseAcademicText,
  type ParsedDocument,
} from "../domain/document-parser";
import { readDocumentText } from "./document-text";

const MESSAGES = {
  too_big: "Ce document est trop gros (4 Mo et 30 pages au maximum).",
  unsupported: "Format non pris en charge. Dépose un PDF avec du texte, un CSV ou un fichier texte.",
  scan: "Ce PDF semble être un scan (une image) : Revio ne sait pas encore lire les images. Colle le texte du document ci-dessous, ou saisis tes matières à la main.",
  unreadable: "Impossible de lire ce document.",
} as const;

/**
 * Reads a document (PDF with text, CSV or text file) or pasted text, and returns a PROPOSAL of subjects,
 * coefficients and grades. Nothing is saved and the file is not kept: it is read in memory and dropped.
 */
export async function analyzeDocument(formData: FormData): Promise<ActionResult<ParsedDocument>> {
  await requireUser();
  const pasted = formData.get("text");
  const file = formData.get("file");
  let text: string;
  if (file instanceof File && file.size > 0) {
    const res = await readDocumentText(file);
    if (!res.ok) return fail({ code: "validation", message: MESSAGES[res.reason] });
    text = res.text;
  } else if (typeof pasted === "string" && pasted.trim().length > 0) {
    text = pasted.slice(0, 200_000);
  } else {
    return fail({ code: "validation", message: "Choisis un fichier ou colle du texte." });
  }
  return succeed(parseAcademicText(text));
}

const importSchema = z.object({
  subjects: z
    .array(
      z.object({
        name: z.string().trim().min(1, { error: "Nom obligatoire." }).max(80),
        coefficient: z.number().min(0).max(100),
        semester: z
          .string()
          .trim()
          .max(40)
          .nullish()
          .transform((v) => v || null),
        grades: z
          .array(
            z
              .object({
                value: z.number().min(0),
                maxValue: z.number().positive().max(1000),
              })
              .refine((g) => g.value <= g.maxValue, { error: "La note dépasse le barème." }),
          )
          .max(MAX_GRADES_PER_SUBJECT),
      }),
    )
    .min(1, { error: "Rien à importer." })
    .max(MAX_SUBJECTS),
});
export type ImportInput = z.input<typeof importSchema>;

/**
 * Saves what the user confirmed. A subject whose name the user already has is not duplicated: its grades
 * are added to the existing one (its coefficient is left as it is).
 */
export async function importSubjects(
  input: ImportInput,
): Promise<ActionResult<{ subjects: number; grades: number }>> {
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return fail({ code: "validation", message: parsed.error.issues[0]?.message ?? "Données invalides." });
  }
  const { supabase } = await requireUser();
  const existing = await supabase.from("subjects").select("id, name");
  if (existing.error) return fail(toActionError(existing.error));
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const ids = new Map<string, string>(existing.data.map((s) => [fold(String(s.name)), String(s.id)]));

  const toCreate = parsed.data.subjects.filter((s, i, all) => {
    const key = fold(s.name);
    return !ids.has(key) && all.findIndex((o) => fold(o.name) === key) === i;
  });
  if (toCreate.length > 0) {
    const created = await supabase
      .from("subjects")
      .insert(toCreate.map((s) => ({ name: s.name, coefficient: s.coefficient, semester: s.semester })))
      .select("id, name");
    if (created.error) return fail(toActionError(created.error));
    for (const row of created.data) ids.set(fold(String(row.name)), String(row.id));
  }

  const gradeRows = parsed.data.subjects.flatMap((s) => {
    const subjectId = ids.get(fold(s.name));
    if (!subjectId) return [];
    return s.grades.map((g) => ({
      subject_id: subjectId,
      label: "Importé d'un document",
      value: g.value,
      max_value: g.maxValue,
      coefficient: 1,
      kind: "other",
    }));
  });
  if (gradeRows.length > 0) {
    const { error } = await supabase.from("grades").insert(gradeRows);
    if (error) {
      return fail({
        code: "internal",
        message: "Les matières sont créées mais certaines notes n'ont pas pu l'être. Vérifie ta liste.",
      });
    }
  }
  refresh();
  return succeed({ subjects: toCreate.length, grades: gradeRows.length });
}
