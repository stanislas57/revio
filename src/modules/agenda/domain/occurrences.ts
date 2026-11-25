/** Expands events (with a simple recurrence) and exams into per-day agenda items. Pure. */

import { addDays, daysBetween, eachDay } from "./dates";
import type { AgendaItem, CalendarEvent, ExamItem } from "./types";

/** "HH:MM:SS" (Postgres) or "HH:MM" → "HH:MM". */
export function trimTime(time: string | null): string | null {
  return time === null ? null : time.slice(0, 5);
}

function occursOn(event: CalendarEvent, day: string): boolean {
  if (day < event.startsOn || day > event.lastOn) return false;
  switch (event.recurrence) {
    case "none":
      return day === event.startsOn;
    case "daily":
      return true;
    case "weekly":
      return daysBetween(event.startsOn, day) % 7 === 0;
  }
}

/** Items of every day in [from, to] (inclusive), keyed by day. Days without items are present and empty. */
export function expandRange(
  events: CalendarEvent[],
  exams: ExamItem[],
  from: string,
  to: string,
): Map<string, AgendaItem[]> {
  const byDay = new Map<string, AgendaItem[]>();
  for (const day of eachDay(from, to)) byDay.set(day, []);

  for (const event of events) {
    const start = event.startsOn > from ? event.startsOn : from;
    const end = event.lastOn < to ? event.lastOn : to;
    for (let day = start; day <= end; day = addDays(day, 1)) {
      if (!occursOn(event, day)) continue;
      byDay.get(day)?.push({
        key: `event:${event.id}`,
        source: "event",
        id: event.id,
        date: day,
        title: event.title,
        kind: event.kind,
        subjectId: event.subjectId,
        startTime: trimTime(event.startTime),
        endTime: trimTime(event.endTime),
        recurring: event.recurrence !== "none",
      });
    }
  }

  for (const exam of exams) {
    byDay.get(exam.examOn)?.push({
      key: `exam:${exam.id}`,
      source: "exam",
      id: exam.id,
      date: exam.examOn,
      title: exam.title,
      kind: "exam",
      subjectId: exam.subjectId,
      startTime: null,
      endTime: null,
      recurring: false,
    });
  }

  for (const items of byDay.values()) items.sort(compareItems);
  return byDay;
}

/** All-day items first (exams before other all-day), then by start time, then by title. */
export function compareItems(a: AgendaItem, b: AgendaItem): number {
  const rank = (i: AgendaItem) => (i.kind === "exam" ? 0 : i.startTime === null ? 1 : 2);
  return (
    rank(a) - rank(b) ||
    (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
    a.title.localeCompare(b.title, "fr")
  );
}

/** Overlapping timed items of the same day (all-day items never conflict). */
export function findConflicts(items: AgendaItem[]): Set<string> {
  const timed = items.filter((i) => i.startTime !== null && i.endTime !== null && i.kind !== "unavailable");
  const unavailable = items.filter((i) => i.kind === "unavailable" && i.startTime !== null);
  const conflicts = new Set<string>();
  const overlap = (a: AgendaItem, b: AgendaItem) => a.startTime! < b.endTime! && b.startTime! < a.endTime!;
  for (const slot of items.filter((i) => i.kind === "study" && i.startTime !== null)) {
    for (const other of [...timed, ...unavailable]) {
      if (other.key !== slot.key && overlap(slot, other)) {
        conflicts.add(slot.key);
        conflicts.add(other.key);
      }
    }
  }
  return conflicts;
}
