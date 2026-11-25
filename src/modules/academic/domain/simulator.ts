/**
 * Grade simulator — indicative only (Revio convention, see weighted-average.ts).
 * No compensation rule of any institution is applied.
 *
 * Adding one grade g (coefficient c, scale m) to a subject makes the resulting
 * average an affine, non-decreasing function of g. So the worst case is g = 0,
 * the best case is g = m, and the grade needed for a target is found by linear
 * interpolation between the two. This avoids error-prone closed-form algebra.
 */

import { overallAverage, weightedAverage, type GradeInput, type SubjectInput } from "./weighted-average";

export type HypotheticalGrade = {
  subjectId: string;
  coefficient: number;
  maxValue: number;
};

export type SimulationScope = "overall" | "subject";

const EPSILON = 1e-9;

function assertHypothesis({ coefficient, maxValue }: HypotheticalGrade): void {
  if (!Number.isFinite(maxValue) || maxValue <= 0) throw new RangeError("Barème invalide.");
  if (!Number.isFinite(coefficient) || coefficient < 0) throw new RangeError("Coefficient invalide.");
}

function withGrade(
  subjects: readonly SubjectInput[],
  hypothesis: HypotheticalGrade,
  value: number,
): SubjectInput[] {
  if (!subjects.some((s) => s.id === hypothesis.subjectId)) {
    throw new RangeError("Matière inconnue.");
  }
  const extra: GradeInput = { value, maxValue: hypothesis.maxValue, coefficient: hypothesis.coefficient };
  return subjects.map((s) => (s.id === hypothesis.subjectId ? { ...s, grades: [...s.grades, extra] } : s));
}

/** Average (subject or overall, on /20) if the hypothetical grade were `value`. */
export function projectAverage(
  subjects: readonly SubjectInput[],
  hypothesis: HypotheticalGrade,
  value: number,
  scope: SimulationScope,
): number | null {
  assertHypothesis(hypothesis);
  const next = withGrade(subjects, hypothesis, value);
  if (scope === "overall") return overallAverage(next);
  const subject = next.find((s) => s.id === hypothesis.subjectId);
  return subject ? weightedAverage(subject.grades) : null;
}

export type RequiredGradeResult =
  /** Some grade between 0 and the scale reaches the target. */
  | { status: "reachable"; requiredValue: number; worst: number; best: number }
  /** Even 0 reaches the target. */
  | { status: "guaranteed"; worst: number; best: number }
  /** Even the maximum grade does not reach the target. */
  | { status: "impossible"; worst: number; best: number }
  /** This grade does not change the average (coefficient 0, subject coefficient 0...). */
  | { status: "no_effect"; current: number | null };

/**
 * Minimum grade (on the hypothesis' scale, rounded UP to 0.01) needed so that
 * the subject or overall average reaches `target` (on /20).
 */
export function requiredGrade(
  subjects: readonly SubjectInput[],
  hypothesis: HypotheticalGrade,
  target: number,
  scope: SimulationScope,
): RequiredGradeResult {
  if (!Number.isFinite(target) || target < 0 || target > 20) throw new RangeError("Objectif invalide.");
  const worst = projectAverage(subjects, hypothesis, 0, scope);
  const best = projectAverage(subjects, hypothesis, hypothesis.maxValue, scope);

  if (worst === null || best === null || best - worst < EPSILON) {
    const current =
      scope === "overall"
        ? overallAverage(subjects)
        : weightedAverage(subjects.find((s) => s.id === hypothesis.subjectId)?.grades ?? []);
    return { status: "no_effect", current };
  }
  if (worst >= target - EPSILON) return { status: "guaranteed", worst, best };
  if (best < target - EPSILON) return { status: "impossible", worst, best };

  const exact = ((target - worst) / (best - worst)) * hypothesis.maxValue;
  const requiredValue = Math.min(hypothesis.maxValue, Math.ceil(exact * 100 - EPSILON) / 100);
  return { status: "reachable", requiredValue, worst, best };
}
