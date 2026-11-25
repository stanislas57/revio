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
 *  3. Overall average  = Σ(subjectAvg × subjectCoef) / Σ(subjectCoef),
 *     over subjects that have at least one grade.
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
  if (coefficient <= 0) throw new InvalidGradeError("Le coefficient doit être strictement positif.");
}

/** Returns the weighted average on /20, or null when there is no grade. */
export function weightedAverage(grades: readonly GradeInput[]): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const grade of grades) {
    assertGrade(grade);
    const { value, maxValue = DEFAULT_SCALE, coefficient = 1 } = grade;
    weightedSum += (value / maxValue) * DEFAULT_SCALE * coefficient;
    totalWeight += coefficient;
  }
  return totalWeight === 0 ? null : weightedSum / totalWeight;
}

/** Overall average on /20 across subjects, or null when no subject has grades. */
export function overallAverage(subjects: readonly SubjectInput[]): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const subject of subjects) {
    if (!Number.isFinite(subject.coefficient) || subject.coefficient <= 0) {
      throw new InvalidGradeError("Le coefficient de matière doit être strictement positif.");
    }
    const average = weightedAverage(subject.grades);
    if (average === null) continue;
    weightedSum += average * subject.coefficient;
    totalWeight += subject.coefficient;
  }
  return totalWeight === 0 ? null : weightedSum / totalWeight;
}
