import { z } from "zod";
import { mySchoolSchema } from "./schools";

/** Years of study offered in the onboarding (France: lycée, then higher education). */
export const STUDY_LEVELS = [
  "seconde",
  "premiere",
  "terminale",
  "bac1",
  "bac2",
  "bac3",
  "master",
  "other",
] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];

export const STUDY_LEVEL_LABELS: Record<StudyLevel, { label: string; hint: string }> = {
  seconde: { label: "Seconde", hint: "Lycée" },
  premiere: { label: "Première", hint: "Lycée" },
  terminale: { label: "Terminale", hint: "Lycée, bac" },
  bac1: { label: "Bac + 1", hint: "L1, BUT 1, BTS 1, prépa 1" },
  bac2: { label: "Bac + 2", hint: "L2, BUT 2, BTS 2, prépa 2" },
  bac3: { label: "Bac + 3", hint: "Licence, BUT 3, bachelor" },
  master: { label: "Bac + 4 ou 5", hint: "Master, école" },
  other: { label: "Autre", hint: "Collège, reprise d'études…" },
};

/** Optional. `prefer_not` records "Je préfère ne pas répondre"; not answering at all is `null`. */
export const GENDERS = ["female", "male", "non_binary", "prefer_not"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  female: "Fille ou femme",
  male: "Garçon ou homme",
  non_binary: "Non-binaire ou autre",
  prefer_not: "Je préfère ne pas répondre",
};

/** Answers of the onboarding and of "Mes informations". Every field may be left empty. */
export const educationAnswersSchema = z.object({
  schoolId: mySchoolSchema.shape.schoolId,
  studyLevel: z.enum(STUDY_LEVELS, { error: "Niveau d'études inconnu." }).nullable(),
  gender: z.enum(GENDERS, { error: "Réponse inconnue." }).nullable(),
});
export type EducationAnswers = z.infer<typeof educationAnswersSchema>;

/** "Mes informations": study level and gender only (the school has its own picker and button). */
export const educationDetailsSchema = educationAnswersSchema.pick({ studyLevel: true, gender: true });
export type EducationDetails = z.infer<typeof educationDetailsSchema>;
