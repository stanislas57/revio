/**
 * Study-time split — a SUGGESTION from a stated assumption, never a forecast.
 *
 * Given a time budget and the priorities (priority.ts), three modes share the minutes:
 *  - "priorities": proportional to the priority score (urgent exams and big gaps first);
 *  - "balanced":   proportional to the subject coefficient (every subject by its weight);
 *  - "returns":    proportional to the points of overall average gained per point in the subject
 *                  (the coefficient share), only for subjects below their target.
 * Revio does not know how much a minute of study improves a grade: the split says where to
 * look, not what you will get. Minutes are rounded to steps of 5 and always add up to the budget.
 */

export type AllocationMode = "priorities" | "balanced" | "returns";

export const ALLOCATION_MODES: readonly { id: AllocationMode; label: string; help: string }[] = [
  {
    id: "priorities",
    label: "Selon mes priorités",
    help: "Plus de temps pour les matières les plus en retard ou avec un examen proche.",
  },
  {
    id: "balanced",
    label: "Équilibré",
    help: "Le temps suit le poids (coefficient) de chaque matière.",
  },
  {
    id: "returns",
    label: "Rentabilité de la moyenne",
    help: "Le temps va aux matières à fort coefficient où l'objectif n'est pas atteint.",
  },
];

export const STEP_MINUTES = 5;
export const MAX_BUDGET_MINUTES = 100 * 60;

export type AllocationInput = {
  id: string;
  name: string;
  coefficient: number;
  /** From computePriorities. */
  score: number;
  pointValue: number;
  needsAttention: boolean;
};

export type Allocation = { id: string; name: string; minutes: number };

function weight(s: AllocationInput, mode: AllocationMode): number {
  if (s.coefficient <= 0) return 0;
  if (mode === "priorities") return s.score;
  if (mode === "balanced") return s.coefficient;
  return s.needsAttention ? s.pointValue : 0;
}

/**
 * Splits `budgetMinutes` (a multiple of 5 is not required: the remainder below 5 is dropped).
 * Subjects with no weight get nothing. If no subject has weight, falls back to the coefficient
 * split so the user always gets an answer. Largest-remainder rounding, ties by name.
 */
export function allocateStudyTime(
  subjects: readonly AllocationInput[],
  budgetMinutes: number,
  mode: AllocationMode,
): Allocation[] {
  if (!Number.isFinite(budgetMinutes) || budgetMinutes < 0 || budgetMinutes > MAX_BUDGET_MINUTES) {
    throw new RangeError("Temps disponible invalide.");
  }
  const units = Math.floor(budgetMinutes / STEP_MINUTES);
  let weights = subjects.map((s) => weight(s, mode));
  if (weights.every((w) => w <= 0)) weights = subjects.map((s) => weight(s, "balanced"));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || units === 0) return subjects.map((s) => ({ id: s.id, name: s.name, minutes: 0 }));

  const exact = weights.map((w) => (w / total) * units);
  const base = exact.map(Math.floor);
  let left = units - base.reduce((a, b) => a + b, 0);
  const order = exact
    .map((e, i) => ({ i, rest: e - Math.floor(e) }))
    .filter(({ i }) => weights[i]! > 0)
    .sort((a, b) => b.rest - a.rest || subjects[a.i]!.name.localeCompare(subjects[b.i]!.name, "fr"));
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length, left--) base[order[k]!.i]! += 1;
  return subjects.map((s, i) => ({ id: s.id, name: s.name, minutes: base[i]! * STEP_MINUTES }));
}
