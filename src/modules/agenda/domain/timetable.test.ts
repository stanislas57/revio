import { describe, expect, it } from "vitest";
import { formatWeekRange } from "./dates";
import type { AgendaItem } from "./types";
import {
  countdownLabel,
  durationMinutes,
  formatDuration,
  hourBounds,
  itemState,
  layoutBlocks,
  localNow,
  progress,
  summarize,
  toMinutes,
  toTime,
} from "./timetable";

function item(partial: Partial<AgendaItem> & { key: string }): AgendaItem {
  return {
    source: "event",
    id: partial.key,
    date: "2026-11-27",
    title: partial.key,
    kind: "class",
    subjectId: null,
    startTime: null,
    endTime: null,
    recurring: false,
    planStatus: null,
    planReason: null,
    ...partial,
  };
}

describe("times and durations", () => {
  it("converts HH:MM and minutes both ways", () => {
    expect(toMinutes("08:30")).toBe(510);
    expect(toTime(510)).toBe("08:30");
    expect(toTime(0)).toBe("00:00");
  });

  it("writes a duration the French way", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(330)).toBe("5 h 30");
    expect(formatDuration(65)).toBe("1 h 05");
  });

  it("measures timed items only", () => {
    expect(durationMinutes({ startTime: "08:00", endTime: "10:00" })).toBe(120);
    expect(durationMinutes({ startTime: null, endTime: null })).toBe(0);
  });
});

describe("localNow", () => {
  it("gives the wall clock of the time zone, across a date change", () => {
    const instant = new Date("2026-11-27T23:30:00Z");
    expect(localNow("Europe/Paris", instant)).toEqual({ date: "2026-11-28", minutes: 30 });
    expect(localNow("UTC", instant)).toEqual({ date: "2026-11-27", minutes: 23 * 60 + 30 });
  });

  it("never gives hour 24 at midnight", () => {
    expect(localNow("UTC", new Date("2026-11-27T00:05:00Z"))).toEqual({ date: "2026-11-27", minutes: 5 });
  });
});

describe("hourBounds", () => {
  it("defaults to 8 h – 19 h and widens for early or late items", () => {
    expect(hourBounds([[]])).toEqual({ first: 8, last: 19 });
    const early = item({ key: "a", startTime: "06:30", endTime: "07:30" });
    const late = item({ key: "b", startTime: "20:00", endTime: "21:15" });
    expect(hourBounds([[early], [late]])).toEqual({ first: 6, last: 22 });
  });

  it("stays within the day", () => {
    const night = item({ key: "n", startTime: "00:00", endTime: "23:59" });
    expect(hourBounds([[night]])).toEqual({ first: 0, last: 24 });
  });

  it("ignores all-day items", () => {
    expect(hourBounds([[item({ key: "x", kind: "exam" })]])).toEqual({ first: 8, last: 19 });
  });
});

describe("layoutBlocks", () => {
  it("puts consecutive items in a single column", () => {
    const blocks = layoutBlocks([
      item({ key: "a", startTime: "08:00", endTime: "10:00" }),
      item({ key: "b", startTime: "10:00", endTime: "11:00" }),
    ]);
    expect(blocks.map((b) => [b.item.key, b.lane, b.lanes])).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("puts overlapping items side by side and reuses a free column", () => {
    const blocks = layoutBlocks([
      item({ key: "a", startTime: "08:00", endTime: "10:00" }),
      item({ key: "b", startTime: "09:00", endTime: "09:30" }),
      item({ key: "c", startTime: "09:30", endTime: "11:00" }),
    ]);
    const by = Object.fromEntries(blocks.map((b) => [b.item.key, b]));
    expect([by.a!.lane, by.b!.lane, by.c!.lane]).toEqual([0, 1, 1]);
    expect(blocks.every((b) => b.lanes === 2)).toBe(true);
  });

  it("leaves out all-day and zero-length items", () => {
    expect(
      layoutBlocks([
        item({ key: "e", kind: "exam" }),
        item({ key: "z", startTime: "09:00", endTime: "09:00" }),
      ]),
    ).toEqual([]);
  });
});

describe("summarize", () => {
  it("adds up class hours, revision hours and exams of the range", () => {
    const byDay = new Map<string, AgendaItem[]>([
      ["2026-11-23", [item({ key: "m", startTime: "08:00", endTime: "10:00" })]],
      [
        "2026-11-24",
        [
          item({ key: "s", kind: "study", startTime: "17:30", endTime: "19:00" }),
          item({ key: "x", kind: "exam" }),
        ],
      ],
      ["2026-11-30", [item({ key: "out", startTime: "08:00", endTime: "09:00" })]],
    ]);
    expect(summarize(byDay, "2026-11-23", "2026-11-29")).toEqual({
      classMinutes: 120,
      classCount: 1,
      studyMinutes: 90,
      exams: 1,
    });
  });
});

describe("itemState and progress", () => {
  const today = "2026-11-27";
  const slot = { date: today, startTime: "15:45", endTime: "17:00" };
  it("tells done, in progress and later", () => {
    expect(itemState(slot, today, 16 * 60 + 26)).toBe("current");
    expect(itemState(slot, today, 17 * 60)).toBe("past");
    expect(itemState(slot, today, 12 * 60)).toBe("future");
    expect(itemState({ ...slot, date: "2026-11-26" }, today, 0)).toBe("past");
    expect(itemState({ ...slot, date: "2026-11-28" }, today, 23 * 60)).toBe("future");
    expect(itemState({ date: today, startTime: null, endTime: null }, today, 600)).toBe("future");
  });

  it("measures the part done and the minutes left", () => {
    expect(progress({ startTime: "15:45", endTime: "17:00" }, 16 * 60 + 26)).toEqual({
      percent: 55,
      minutesLeft: 34,
    });
    expect(progress({ startTime: "10:00", endTime: "11:00" }, 9 * 60)).toEqual({
      percent: 0,
      minutesLeft: 120,
    });
  });
});

describe("countdownLabel", () => {
  it("says Aujourd'hui, Demain, then J-n", () => {
    expect(countdownLabel(0)).toBe("Aujourd'hui");
    expect(countdownLabel(1)).toBe("Demain");
    expect(countdownLabel(10)).toBe("J-10");
  });
});

describe("formatWeekRange", () => {
  it("writes the week of a month, or across two months", () => {
    expect(formatWeekRange("2026-11-23", "2026-11-29")).toBe("23 au 29 novembre");
    expect(formatWeekRange("2026-11-30", "2026-12-06")).toBe("30 nov. au 6 déc.");
  });
});
