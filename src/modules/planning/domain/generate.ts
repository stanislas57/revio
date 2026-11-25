/**
 * Basic planning: proposes revision sessions from the subject priorities and the free time.
 * Deterministic, no AI. Revio convention, not an official method: the numbers below are defaults.
 *
 * Rules:
 *  - sessions fit inside the study window and never overlap another timed item;
 *  - at most `maxMinutesPerDay` of revision per day, counting what is already in the agenda;
 *  - a break of `breakMinutes` between two revision sessions;
 *  - an all-day "indisponible" event blocks the whole day;
 *  - at most one new session per subject and per day;
 *  - a subject with an exam only gets sessions strictly before the exam day;
 *  - subjects are served in proportion to their priority score (sessions already accepted or locked
 *    count as already given), and subjects whose score is 0 get nothing.
 */

import type { AgendaItem } from "@/modules/agenda/domain/types";

export type PlanSettings = {
  /** Study window, minutes since midnight. */
  windowStart: number;
  windowEnd: number;
  sessionMinutes: number;
  breakMinutes: number;
  maxMinutesPerDay: number;
  /** Upper bound on the number of sessions proposed in one run. */
  maxSessions: number;
  /** Candidate start times are multiples of this many minutes. */
  stepMinutes: number;
};

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  windowStart: 8 * 60,
  windowEnd: 21 * 60,
  sessionMinutes: 45,
  breakMinutes: 15,
  maxMinutesPerDay: 180,
  maxSessions: 8,
  stepMinutes: 15,
};

export type PlanSubject = {
  id: string;
  name: string;
  /** Priority score (> 0 to be planned). */
  score: number;
  /** Explanation of the priority, copied into the session. */
  reason: string;
  /** First exam day of the subject inside the horizon, if any. */
  examOn: string | null;
};

export type PlannedSlot = {
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type PlanInput = {
  /** Days to plan, in order, with what the agenda already holds (recommended sessions excluded). */
  days: { date: string; items: AgendaItem[] }[];
  subjects: PlanSubject[];
  /** Planning does not start before this moment today (minutes since midnight). */
  nowMinutes: number;
  today: string;
  settings?: Partial<PlanSettings>;
};

export const toMinutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
export const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

type Interval = { start: number; end: number; study: boolean };

type DayState = {
  date: string;
  blocked: boolean;
  busy: Interval[];
  studyMinutes: number;
  subjectsToday: Set<string>;
};

function dayState(date: string, items: AgendaItem[]): DayState {
  const busy: Interval[] = [];
  let studyMinutes = 0;
  const subjectsToday = new Set<string>();
  for (const item of items) {
    if (item.startTime === null || item.endTime === null) continue;
    const start = toMinutes(item.startTime);
    const end = toMinutes(item.endTime);
    const study = item.kind === "study";
    busy.push({ start, end, study });
    if (study) {
      studyMinutes += end - start;
      if (item.subjectId) subjectsToday.add(item.subjectId);
    }
  }
  const blocked = items.some((i) => i.kind === "unavailable" && i.startTime === null);
  return { date, blocked, busy, studyMinutes, subjectsToday };
}

function fits(day: DayState, start: number, s: PlanSettings): boolean {
  const end = start + s.sessionMinutes;
  if (start < s.windowStart || end > s.windowEnd) return false;
  return day.busy.every((b) => {
    const pad = b.study ? s.breakMinutes : 0;
    return end <= b.start - pad || start >= b.end + pad;
  });
}

function firstFreeStart(day: DayState, notBefore: number, s: PlanSettings): number | null {
  const from = Math.max(s.windowStart, Math.ceil(notBefore / s.stepMinutes) * s.stepMinutes);
  for (let start = from; start + s.sessionMinutes <= s.windowEnd; start += s.stepMinutes) {
    if (fits(day, start, s)) return start;
  }
  return null;
}

/** Proposes sessions. Never mutates its input. Order of the result: chronological. */
export function generatePlan(input: PlanInput): PlannedSlot[] {
  const s: PlanSettings = { ...DEFAULT_PLAN_SETTINGS, ...input.settings };
  const days = input.days.map((d) => dayState(d.date, d.items));
  const candidates = input.subjects.filter((x) => x.score > 0);
  if (candidates.length === 0) return [];

  // Sessions already planned (accepted / locked) count as already given to their subject.
  const given = new Map<string, number>();
  for (const d of input.days) {
    for (const item of d.items) {
      if (item.planStatus && item.subjectId) given.set(item.subjectId, (given.get(item.subjectId) ?? 0) + 1);
    }
  }

  const result: PlannedSlot[] = [];
  const exhausted = new Set<string>();

  while (result.length < s.maxSessions) {
    // Next subject: highest score per session already given (+1), ties by score then name.
    const pick = candidates
      .filter((c) => !exhausted.has(c.id))
      .map((c) => ({ c, weight: c.score / ((given.get(c.id) ?? 0) + 1) }))
      .sort(
        (a, b) => b.weight - a.weight || b.c.score - a.c.score || a.c.name.localeCompare(b.c.name, "fr"),
      )[0];
    if (!pick) break;
    const subject = pick.c;

    // Least loaded eligible day first (spreads the work), then earliest.
    const eligible = days
      .filter(
        (d) =>
          !d.blocked &&
          d.studyMinutes + s.sessionMinutes <= s.maxMinutesPerDay &&
          !d.subjectsToday.has(subject.id) &&
          (subject.examOn === null || d.date < subject.examOn),
      )
      .sort((a, b) => a.studyMinutes - b.studyMinutes || a.date.localeCompare(b.date));

    let placed = false;
    for (const day of eligible) {
      const notBefore = day.date === input.today ? input.nowMinutes : 0;
      const start = firstFreeStart(day, notBefore, s);
      if (start === null) continue;
      day.busy.push({ start, end: start + s.sessionMinutes, study: true });
      day.studyMinutes += s.sessionMinutes;
      day.subjectsToday.add(subject.id);
      given.set(subject.id, (given.get(subject.id) ?? 0) + 1);
      result.push({
        subjectId: subject.id,
        date: day.date,
        startTime: toHHMM(start),
        endTime: toHHMM(start + s.sessionMinutes),
        reason: subject.reason,
      });
      placed = true;
      break;
    }
    if (!placed) exhausted.add(subject.id);
  }

  return result.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}
