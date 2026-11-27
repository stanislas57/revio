import { addDays, weekdayIndex } from "./dates";
import type { EventKind } from "./types";

/** The "Ajouter à l'agenda" path made of buttons only: nothing to type. */
export const QUICK_TYPES = ["revision", "cours", "examen", "devoir", "projet", "pause"] as const;
export type QuickType = (typeof QUICK_TYPES)[number];

export const QUICK_TYPE_LABELS: Record<QuickType, { label: string; hint: string }> = {
  revision: { label: "Révision", hint: "Une séance de travail" },
  cours: { label: "Cours", hint: "Un cours à suivre" },
  examen: { label: "Examen", hint: "Toute la journée" },
  devoir: { label: "Devoir", hint: "Un travail à rendre" },
  projet: { label: "Projet", hint: "Un travail de plus longue haleine" },
  pause: { label: "Pause", hint: "Un temps pour souffler" },
};

/** Database kind of each type (the agenda knows study, class, unavailable, other; exams have their own table). */
export const QUICK_KIND: Record<Exclude<QuickType, "examen">, EventKind> = {
  revision: "study",
  cours: "class",
  devoir: "other",
  projet: "other",
  pause: "unavailable",
};

/** Subjects are not asked for a break. */
export const needsSubject = (type: QuickType) => type !== "pause";
/** An exam is a whole day: no time, no duration. */
export const needsTime = (type: QuickType) => type !== "examen";

/** "Autre": ready-made labels for what is not one of the user's subjects. */
export const OTHER_SUBJECTS = ["Révisions générales", "Organisation", "Lecture", "Sport", "Détente"] as const;

export const SLOT_HOURS = [8, 10, 12, 14, 16, 18, 20] as const;
export const DURATIONS = [
  { minutes: 25, label: "25 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 90, label: "1 h 30" },
  { minutes: 120, label: "2 h" },
] as const;

export type DayChoice = "today" | "tomorrow" | "after" | "weekend" | "next-week";
export const DAY_LABELS: Record<DayChoice, string> = {
  today: "Aujourd'hui",
  tomorrow: "Demain",
  after: "Après-demain",
  weekend: "Ce week-end",
  "next-week": "Semaine prochaine",
};

/** The date of each day button, from `today` (Monday = 0). "Ce week-end" is the coming Saturday, or today on a weekend. */
export function resolveDay(choice: DayChoice, today: string): string {
  const w = weekdayIndex(today);
  switch (choice) {
    case "today":
      return today;
    case "tomorrow":
      return addDays(today, 1);
    case "after":
      return addDays(today, 2);
    case "weekend":
      return w >= 5 ? today : addDays(today, 5 - w);
    case "next-week":
      return addDays(today, 7 - w);
  }
}

const pad = (n: number) => String(n).padStart(2, "0");
export const hourLabel = (h: number) => `${h} h`;

/** "HH:MM" `minutes` after `start`; null if it would pass midnight (an event cannot). */
export function endTime(start: string, minutes: number): string | null {
  const [h, m] = start.split(":").map(Number) as [number, number];
  const total = h * 60 + m + minutes;
  return total >= 24 * 60 ? null : `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export type QuickAnswers = {
  type: QuickType;
  /** One of the user's subjects. */
  subject: { id: string; name: string } | null;
  /** An "Autre" label, used as the subject text when no subject is chosen. */
  other: string | null;
  day: DayChoice;
  hour: number | null;
  minutes: number | null;
};

export type QuickResult =
  | { kind: "exam"; input: { title: string; subjectId: string | null; examOn: string } }
  | {
      kind: "event";
      input: {
        title: string;
        kind: EventKind;
        subjectId: string | null;
        startsOn: string;
        startTime: string;
        endTime: string;
        recurrence: "none";
        repeatUntil: "";
      };
    };

/** What a quick-add answers say, in words (title of the event, and of the recap). */
export function quickTitle(a: Pick<QuickAnswers, "type" | "subject" | "other">): string {
  const base = QUICK_TYPE_LABELS[a.type].label;
  const what = a.subject?.name ?? a.other;
  return what && needsSubject(a.type) ? `${base} · ${what}` : base;
}

/** Turns the answers into the input of `addEvent` (or `addExam`); null while an answer is missing or impossible. */
export function buildQuickResult(a: QuickAnswers, today: string): QuickResult | null {
  const startsOn = resolveDay(a.day, today);
  const title = quickTitle(a);
  if (a.type === "examen") {
    return { kind: "exam", input: { title, subjectId: a.subject?.id ?? null, examOn: startsOn } };
  }
  if (needsSubject(a.type) && !a.subject && !a.other) return null;
  if (a.hour === null || a.minutes === null) return null;
  const startTime = `${pad(a.hour)}:00`;
  const end = endTime(startTime, a.minutes);
  if (end === null) return null;
  return {
    kind: "event",
    input: {
      title,
      kind: QUICK_KIND[a.type],
      subjectId: a.subject?.id ?? null,
      startsOn,
      startTime,
      endTime: end,
      recurrence: "none",
      repeatUntil: "",
    },
  };
}
