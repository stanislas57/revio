/**
 * Weighted average — Revio's default convention.
 *
 * IMPORTANT: this is a generic, commonly used method, NOT the official rule of
 * any school or university. Institutions differ (rounding, dropped grades,
 * compensation, ECTS...). The UI must say so whenever it shows a result.
 *
 * Convention:
 *  1. Each grade is normalised to a /20 scale: value / maxValue * 20.
 *  2. Subject average = Σ(normalised × gradeCoef) / Σ(gradeCoef).
 *  3. Group average (UE, semester, overall) = Σ(subjectAvg × subjectCoef) / Σ(subjectCoef),
 *     over subjects that have an average and a coefficient > 0.
 *  4. A coefficient of 0 is allowed: the item is kept for information but
 *     weighs nothing. If every weight is 0, there is no average (null).
 *  No rounding here: rounding is a display concern.
 */

export const DEFAULT_SCALE = 20;

export type GradeInput = {
  value: number;
  maxValue?: number;
  coefficient?: number;
};

export type SubjectInput = {
  id: string;
  coefficient: number;
  grades: readonly GradeInput[];
};

export class InvalidGradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGradeError";
  }
}

function assertGrade({ value, maxValue = DEFAULT_SCALE, coefficient = 1 }: GradeInput): void {
  if (![value, maxValue, coefficient].every(Number.isFinite)) {
    throw new InvalidGradeError("Les valeurs doivent être des nombres finis.");
  }
  if (maxValue <= 0) throw new InvalidGradeError("Le barème doit être strictement positif.");
  if (value < 0 || value > maxValue)
    throw new InvalidGradeError("La note doit être comprise entre 0 et le barème.");
  if (coefficient < 0) throw new InvalidGradeError("Le coefficient ne peut pas être négatif.");
}

function assertSubjectCoefficient(coefficient: number): void {
  if (!Number.isFinite(coefficient) || coefficient < 0) {
    throw new InvalidGradeError("Le coefficient de matière doit être un nombre positif ou nul.");
  }
}

/** Grade value converted to the /20 scale. */
export function normalise(grade: GradeInput): number {
  assertGrade(grade);
  return (grade.value / (grade.maxValue ?? DEFAULT_SCALE)) * DEFAULT_SCALE;
}

/** Returns the weighted average on /20, or null when no grade carries weight. */
export function weightedAverage(grades: readonly GradeInput[]): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const grade of grades) {
    const normalised = normalise(grade);
    const coefficient = grade.coefficient ?? 1;
    weightedSum += normalised * coefficient;
    totalWeight += coefficient;
  }
  return totalWeight === 0 ? null : weightedSum / totalWeight;
}

/** Weighted average of subject averages, or null when no subject counts. */
export function overallAverage(subjects: readonly SubjectInput[]): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const subject of subjects) {
    assertSubjectCoefficient(subject.coefficient);
    const average = weightedAverage(subject.grades);
    if (average === null || subject.coefficient === 0) continue;
    weightedSum += average * subject.coefficient;
    totalWeight += subject.coefficient;
  }
  return totalWeight === 0 ? null : weightedSum / totalWeight;
}

export type GroupAverage = {
  /** Group label, or null for subjects without a group. */
  key: string | null;
  average: number | null;
  subjectIds: string[];
  /** Sum of coefficients of the subjects that have an average. */
  countedCoefficient: number;
};

/**
 * Averages per group (UE, semester...), in order of first appearance.
 * Subjects without a group are gathered under key null.
 */
export function groupAverages<S extends SubjectInput>(
  subjects: readonly S[],
  groupOf: (subject: S) => string | null | undefined,
): GroupAverage[] {
  const groups = new Map<string | null, S[]>();
  for (const subject of subjects) {
    const key = groupOf(subject)?.trim() || null;
    const list = groups.get(key) ?? [];
    list.push(subject);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, list]) => ({
    key,
    average: overallAverage(list),
    subjectIds: list.map((s) => s.id),
    countedCoefficient: list
      .filter((s) => s.coefficient > 0 && weightedAverage(s.grades) !== null)
      .reduce((sum, s) => sum + s.coefficient, 0),
  }));
}
