export const GRADE_KINDS = ["exam", "continuous", "practical", "oral", "project", "other"] as const;
export type GradeKind = (typeof GRADE_KINDS)[number];

export const GRADE_KIND_LABELS: Record<GradeKind, string> = {
  exam: "Examen",
  continuous: "Contrôle continu",
  practical: "TP",
  oral: "Oral",
  project: "Projet",
  other: "Autre",
};

export type Grade = {
  id: string;
  subjectId: string;
  label: string | null;
  value: number;
  maxValue: number;
  coefficient: number;
  gradedOn: string | null;
  kind: GradeKind;
};

export type Subject = {
  id: string;
  name: string;
  coefficient: number;
  color: string | null;
  teachingUnit: string | null;
  semester: string | null;
  targetAverage: number | null;
  archived: boolean;
  isTemplate: boolean;
  grades: Grade[];
};

export type Exam = {
  id: string;
  subjectId: string | null;
  title: string;
  examOn: string;
};

export type AcademicSnapshot = {
  subjects: Subject[];
  exams: Exam[];
  targetAverage: number | null;
  today: string;
};
