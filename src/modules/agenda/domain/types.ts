export const EVENT_KINDS = ["study", "class", "unavailable", "other"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const RECURRENCES = ["none", "daily", "weekly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const PLAN_STATUSES = ["recommended", "accepted", "locked"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  recommended: "Recommandée",
  accepted: "Acceptée",
  locked: "Verrouillée",
};

export const VIEWS = ["jour", "semaine", "mois"] as const;
export type View = (typeof VIEWS)[number];

/** A calendar event as stored: wall-clock dates and times in the user's time zone. */
export type CalendarEvent = {
  id: string;
  subjectId: string | null;
  title: string;
  kind: EventKind;
  /** First day (YYYY-MM-DD). */
  startsOn: string;
  /** Last day of the series; equal to `startsOn` when it does not repeat. */
  lastOn: string;
  /** "HH:MM", null for an all-day event. */
  startTime: string | null;
  endTime: string | null;
  recurrence: Recurrence;
  /** Set for sessions planned by Revio; null for events typed by hand. */
  planStatus: PlanStatus | null;
  planReason: string | null;
};

export type ExamItem = { id: string; subjectId: string | null; title: string; examOn: string };

/** One displayable entry of a given day (an event occurrence or an exam). */
export type AgendaItem = {
  /** Unique per day: `event:<id>` or `exam:<id>`. */
  key: string;
  source: "event" | "exam";
  /** Id of the underlying event / exam. */
  id: string;
  date: string;
  title: string;
  kind: EventKind | "exam";
  subjectId: string | null;
  startTime: string | null;
  endTime: string | null;
  recurring: boolean;
  planStatus: PlanStatus | null;
  planReason: string | null;
};

export const KIND_LABELS: Record<EventKind | "exam", string> = {
  study: "Révision",
  class: "Cours",
  unavailable: "Indisponible",
  other: "Autre",
  exam: "Examen",
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Une seule fois",
  daily: "Tous les jours",
  weekly: "Toutes les semaines",
};
