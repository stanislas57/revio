import type { AgendaItem } from "../domain/types";

type Kind = AgendaItem["kind"];

/**
 * Colours of the timetable cards, by kind (text colours are chosen for contrast on each background, light and
 * dark). Courses alternate between two soft tints, by subject, so two neighbouring courses are easy to tell apart.
 */
export function cardClass(kind: Kind, tint = 0): string {
  switch (kind) {
    case "class":
      return tint % 2 === 0 ? "bg-brand-soft text-foreground" : "bg-revio-social/20 text-foreground";
    case "study":
      return "bg-revio-deep text-white";
    case "exam":
      return "bg-[image:var(--revio-exam-gradient)] text-white";
    case "unavailable":
      return "border border-dashed bg-muted text-foreground";
    case "other":
      return "border bg-card text-foreground";
  }
}

/** The tint index of a subject: its position in the (sorted) list, so the colours do not change between visits. */
export function tintOf(subjectId: string | null, subjects: { id: string }[]): number {
  return subjectId === null
    ? 0
    : Math.max(
        0,
        subjects.findIndex((s) => s.id === subjectId),
      );
}
