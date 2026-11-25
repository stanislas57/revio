import { z } from "zod";
import { GRADE_KINDS } from "./domain/types";
import { isIsoDate } from "./domain/dates";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `${max} caractères maximum.` })
    .nullish()
    .transform((v) => (v ? v : null));

const isoDate = z.string().refine(isIsoDate, { error: "Date invalide." });

const average = z
  .number({ error: "Nombre attendu." })
  .min(0, { error: "Entre 0 et 20." })
  .max(20, { error: "Entre 0 et 20." });

export const subjectSchema = z.object({
  name: z.string().trim().min(1, { error: "Nom obligatoire." }).max(80, { error: "80 caractères maximum." }),
  coefficient: z
    .number({ error: "Coefficient invalide." })
    .min(0, { error: "Coefficient entre 0 et 100." })
    .max(100, { error: "Coefficient entre 0 et 100." }),
  teachingUnit: optionalText(80),
  semester: optionalText(40),
  targetAverage: average.nullish().transform((v) => v ?? null),
});
export type SubjectInput = z.input<typeof subjectSchema>;

export const gradeSchema = z
  .object({
    subjectId: z.uuid({ error: "Matière invalide." }),
    label: optionalText(120),
    value: z.number({ error: "Note invalide." }).min(0, { error: "La note ne peut pas être négative." }),
    maxValue: z.number({ error: "Barème invalide." }).positive({ error: "Barème > 0." }).max(1000),
    coefficient: z
      .number({ error: "Coefficient invalide." })
      .min(0, { error: "Coefficient entre 0 et 100." })
      .max(100, { error: "Coefficient entre 0 et 100." }),
    gradedOn: isoDate.nullish().transform((v) => v ?? null),
    kind: z.enum(GRADE_KINDS),
  })
  .refine((g) => g.value <= g.maxValue, { error: "La note dépasse le barème.", path: ["value"] });
export type GradeFormInput = z.input<typeof gradeSchema>;

export const examSchema = z.object({
  subjectId: z
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  title: z
    .string()
    .trim()
    .min(1, { error: "Titre obligatoire." })
    .max(120, { error: "120 caractères maximum." }),
  examOn: isoDate,
});
export type ExamInput = z.input<typeof examSchema>;

export const targetSchema = average.nullable();
export const idSchema = z.uuid({ error: "Identifiant invalide." });
