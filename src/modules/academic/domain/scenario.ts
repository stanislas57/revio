/**
 * Multi-grade scenarios — indicative only (Revio convention, see weighted-average.ts).
 *
 * A scenario is a list of HYPOTHETICAL grades added to the real ones. Nothing here is saved or
 * official: it answers "what would my averages be if I got these grades?". No compensation rule
 * of any institution is applied.
 */

import { overallAverage, weightedAverage, type SubjectInput } from "./weighted-average";

export type Hypothesis = {
  subjectId: string;
  value: number;
  maxValue: number;
  coefficient: number;
};

export const MAX_HYPOTHESES = 20;

export type SubjectProjection = {
  subjectId: string;
  before: number | null;
  after: number | null;
};

export type ScenarioProjection = {
  overallBefore: number | null;
  overallAfter: number | null;
  /** Only subjects that have at least one hypothesis. */
  subjects: SubjectProjection[];
  /** Hypotheses ignored because their subject no longer exists. */
  ignored: number;
};

export function projectScenario(
  subjects: readonly SubjectInput[],
  hypotheses: readonly Hypothesis[],
): ScenarioProjection {
  if (hypotheses.length > MAX_HYPOTHESES) throw new RangeError("Trop de notes hypothétiques.");
  const known = new Set(subjects.map((s) => s.id));
  const applicable = hypotheses.filter((h) => known.has(h.subjectId));
  const next = subjects.map((s) => ({
    ...s,
    grades: [
      ...s.grades,
      ...applicable
        .filter((h) => h.subjectId === s.id)
        .map((h) => ({ value: h.value, maxValue: h.maxValue, coefficient: h.coefficient })),
    ],
  }));
  const touched = new Set(applicable.map((h) => h.subjectId));
  return {
    overallBefore: overallAverage(subjects),
    overallAfter: overallAverage(next),
    subjects: next
      .filter((s) => touched.has(s.id))
      .map((s) => ({
        subjectId: s.id,
        before: weightedAverage(subjects.find((x) => x.id === s.id)?.grades ?? []),
        after: weightedAverage(s.grades),
      })),
    ignored: hypotheses.length - applicable.length,
  };
}
