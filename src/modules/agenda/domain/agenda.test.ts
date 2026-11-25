import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, startOfWeek, weekdayIndex } from "./dates";
import { expandRange, findConflicts } from "./occurrences";
import { shiftDate, viewRange } from "./range";
import type { CalendarEvent } from "./types";

const base: CalendarEvent = {
  id: "e1",
  subjectId: null,
  title: "Maths",
  kind: "study",
  startsOn: "2026-12-01",
  lastOn: "2026-12-01",
  startTime: "18:00:00",
  endTime: "19:30:00",
  recurrence: "none",
};

describe("dates", () => {
  it("computes weeks starting on Monday", () => {
    expect(weekdayIndex("2026-11-30")).toBe(0); // Monday
    expect(startOfWeek("2026-12-06")).toBe("2026-11-30"); // Sunday
    expect(startOfWeek("2026-11-30")).toBe("2026-11-30");
  });
  it("adds days and months across boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2); // DST weekend
  });
  it("rejects invalid dates", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow();
  });
});

describe("view ranges", () => {
  it("day and week", () => {
    expect(viewRange("jour", "2026-12-02")).toEqual({ from: "2026-12-02", to: "2026-12-02" });
    expect(viewRange("semaine", "2026-12-02")).toEqual({ from: "2026-11-30", to: "2026-12-06" });
  });
  it("month covers whole weeks", () => {
    // December 2026: starts on a Tuesday, ends on a Thursday.
    expect(viewRange("mois", "2026-12-15")).toEqual({ from: "2026-11-30", to: "2027-01-03" });
  });
  it("shifts by the view's unit", () => {
    expect(shiftDate("jour", "2026-12-02", 1)).toBe("2026-12-03");
    expect(shiftDate("semaine", "2026-12-02", -1)).toBe("2026-11-25");
    expect(shiftDate("mois", "2026-12-15", 1)).toBe("2027-01-01");
  });
});

describe("expandRange", () => {
  it("places a one-off event on its day only", () => {
    const days = expandRange([base], [], "2026-11-30", "2026-12-06");
    expect(days.get("2026-12-01")).toHaveLength(1);
    expect(days.get("2026-12-02")).toHaveLength(0);
    expect(days.get("2026-12-01")?.[0]?.startTime).toBe("18:00");
  });
  it("repeats weekly up to the last day, inclusive", () => {
    const weekly = { ...base, recurrence: "weekly" as const, lastOn: "2026-12-15" };
    const days = expandRange([weekly], [], "2026-11-25", "2026-12-31");
    const dates = [...days].filter(([, i]) => i.length > 0).map(([d]) => d);
    expect(dates).toEqual(["2026-12-01", "2026-12-08", "2026-12-15"]);
  });
  it("repeats daily and clips to the requested range", () => {
    const daily = { ...base, recurrence: "daily" as const, lastOn: "2026-12-10" };
    const days = expandRange([daily], [], "2026-12-08", "2026-12-14");
    expect([...days].filter(([, i]) => i.length > 0).map(([d]) => d)).toEqual([
      "2026-12-08",
      "2026-12-09",
      "2026-12-10",
    ]);
  });
  it("includes exams first, then all-day, then timed by hour", () => {
    const allDay = { ...base, id: "e2", title: "Férié", startTime: null, endTime: null };
    const early = { ...base, id: "e3", title: "Cours", startTime: "08:00:00", endTime: "09:00:00" };
    const days = expandRange(
      [base, allDay, early],
      [{ id: "x1", subjectId: null, title: "Partiel", examOn: "2026-12-01" }],
      "2026-12-01",
      "2026-12-01",
    );
    expect(days.get("2026-12-01")?.map((i) => i.title)).toEqual(["Partiel", "Férié", "Cours", "Maths"]);
  });
  it("ignores events and exams outside the range", () => {
    const days = expandRange(
      [base],
      [{ id: "x1", subjectId: null, title: "Partiel", examOn: "2027-01-10" }],
      "2026-12-07",
      "2026-12-13",
    );
    expect([...days.values()].flat()).toHaveLength(0);
  });
});

describe("findConflicts", () => {
  const day = (events: CalendarEvent[]) =>
    expandRange(events, [], "2026-12-01", "2026-12-01").get("2026-12-01") ?? [];
  it("flags a revision slot overlapping a class or an unavailability", () => {
    const cls = { ...base, id: "c", kind: "class" as const, startTime: "19:00:00", endTime: "20:00:00" };
    expect(findConflicts(day([base, cls]))).toEqual(new Set(["event:e1", "event:c"]));
    const away = { ...cls, id: "u", kind: "unavailable" as const };
    expect(findConflicts(day([base, away]))).toEqual(new Set(["event:e1", "event:u"]));
  });
  it("does not flag back-to-back slots", () => {
    const next = { ...base, id: "n", startTime: "19:30:00", endTime: "20:30:00" };
    expect(findConflicts(day([base, next])).size).toBe(0);
  });
});
