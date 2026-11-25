import { describe, expect, it } from "vitest";
import { elapsedSeconds, formatClock, formatMinutes } from "./time";

const start = "2026-11-25T10:00:00Z";

describe("elapsedSeconds", () => {
  it("counts time since start", () => {
    expect(
      elapsedSeconds(
        { startedAt: start, pausedSeconds: 0, pausedAt: null },
        new Date("2026-11-25T10:45:00Z"),
      ),
    ).toBe(2700);
  });
  it("subtracts finished pauses", () => {
    expect(
      elapsedSeconds(
        { startedAt: start, pausedSeconds: 600, pausedAt: null },
        new Date("2026-11-25T10:45:00Z"),
      ),
    ).toBe(2100);
  });
  it("freezes while paused", () => {
    const clock = { startedAt: start, pausedSeconds: 0, pausedAt: "2026-11-25T10:10:00Z" };
    expect(elapsedSeconds(clock, new Date("2026-11-25T11:00:00Z"))).toBe(600);
  });
  it("is never negative (clock skew)", () => {
    expect(
      elapsedSeconds(
        { startedAt: start, pausedSeconds: 0, pausedAt: null },
        new Date("2026-11-25T09:59:00Z"),
      ),
    ).toBe(0);
  });
});

describe("formatClock / formatMinutes", () => {
  it("formats clocks", () => {
    expect(formatClock(307)).toBe("05:07");
    expect(formatClock(3723)).toBe("1:02:03");
  });
  it("formats durations", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(80)).toBe("1 h 20");
  });
});
