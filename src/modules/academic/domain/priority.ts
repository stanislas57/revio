/**
 * Priority subjects — deterministic and explainable, no AI.
 *
 * For each subject that counts (coefficient > 0):
 *   share   = subject coefficient / Σ coefficients of counted subjects
 *   gap     = max(0, target − average)        (1 point assumed when no grade yet)
 *   urgency = 1 + (14 − days) / 14 when an exam is within 14 days, else 1  (1 to 2)
 *   score   = gap × share × urgency
 * gap × share is literally "points of overall average missing because of this
 * subject"; urgency boosts subjects with an exam coming soon.
 */

import { formatAverage, formatCoefficient, formatPercent } from "./format";

export const DEFAULT_TARGET = 10;
export const URGENCY_WINDOW_DAYS = 14;
const NO_GRADE_GAP = 1;

export type PriorityInput = {
  id: string;
  name: string;
  coefficient: number;
  /** Current average on /20, null when no grade counts. */
  average: number | null;
  /** Subject target, falls back to the overall target, then to 10. */
  target: number | null;
  /** Days until the next exam in this subject (0 = today), null if none. */
  nextExamInDays: number | null;
};

export type Priority = {
  id: string;
  name: string;
  score: number;
  /** Overall-average points gained per extra point in this subject. */
  pointValue: number;
  needsAttention: boolean;
  reason: string;
};

function pluralDays(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} jours`;
}

export function computePriorities(
  subjects: readonly PriorityInput[],
  overallTarget: number | null,
): Priority[] {
  const counted = subjects.filter((s) => s.coefficient > 0);
  const totalCoefficient = counted.reduce((sum, s) => sum + s.coefficient, 0);

  return subjects
    .map((s): Priority => {
      if (s.coefficient <= 0 || totalCoefficient === 0) {
        return {
          id: s.id,
          name: s.name,
          score: 0,
          pointValue: 0,
          needsAttention: false,
          reason: "Coefficient 0 : cette matière ne compte pas dans ta moyenne générale.",
        };
      }
      const share = s.coefficient / totalCoefficient;
      const target = s.target ?? overallTarget ?? DEFAULT_TARGET;
      const gap = s.average === null ? NO_GRADE_GAP : Math.max(0, target - s.average);
      const examSoon = s.nextExamInDays !== null && s.nextExamInDays <= URGENCY_WINDOW_DAYS;
      const urgency = examSoon
        ? 1 + (URGENCY_WINDOW_DAYS - Math.max(0, s.nextExamInDays ?? 0)) / URGENCY_WINDOW_DAYS
        : 1;
      const score = gap * share * urgency;

      const parts: string[] = [];
      if (s.average === null) {
        parts.push("Aucune note encore : impossible de savoir où tu en es.");
      } else if (gap > 0) {
        parts.push(
          `Moyenne ${formatAverage(s.average)} pour un objectif de ${formatAverage(target)} : il manque ${formatAverage(gap)} point${gap >= 2 ? "s" : ""}.`,
        );
      } else {
        parts.push(`Objectif atteint (${formatAverage(s.average)} pour ${formatAverage(target)}).`);
      }
      parts.push(
        `Coefficient ${formatCoefficient(s.coefficient)} (${formatPercent(share)} de ta moyenne) : chaque point gagné ici rapporte ${formatAverage(share)} point à ta moyenne générale.`,
      );
      if (examSoon) parts.push(`Examen ${pluralDays(Math.max(0, s.nextExamInDays ?? 0))}.`);

      return {
        id: s.id,
        name: s.name,
        score,
        pointValue: share,
        needsAttention: score > 0,
        reason: parts.join(" "),
      };
    })
    .sort((a, b) => b.score - a.score || b.pointValue - a.pointValue || a.name.localeCompare(b.name, "fr"));
}
