import { describe, expect, it } from "vitest";
import { clockOffsetMs, elapsedSeconds, formatDuration } from "./elapsed";

const startedAt = "2026-11-25T10:00:00Z";
const at = (iso: string) => Date.parse(iso);

describe("elapsedSeconds", () => {
  it("counts from the start while running", () => {
    expect(elapsedSeconds({ startedAt, pausedAt: null, pausedSeconds: 0 }, at("2026-11-25T10:45:00Z"))).toBe(
      2700,
    );
  });

  it("subtracts finished pauses", () => {
    expect(
      elapsedSeconds({ startedAt, pausedAt: null, pausedSeconds: 300 }, at("2026-11-25T10:45:00Z")),
    ).toBe(2400);
  });

  it("freezes while paused, whatever the current time", () => {
    const s = { startedAt, pausedAt: "2026-11-25T10:20:00Z", pausedSeconds: 60 };
    expect(elapsedSeconds(s, at("2026-11-25T10:21:00Z"))).toBe(1140);
    expect(elapsedSeconds(s, at("2026-11-25T18:00:00Z"))).toBe(1140);
  });

  it("is never negative (local clock behind the server)", () => {
    expect(elapsedSeconds({ startedAt, pausedAt: null, pausedSeconds: 0 }, at("2026-11-25T09:59:00Z"))).toBe(
      0,
    );
  });

  it("works across midnight", () => {
    const s = { startedAt: "2026-11-25T23:30:00Z", pausedAt: null, pausedSeconds: 0 };
    expect(elapsedSeconds(s, at("2026-11-26T00:15:00Z"))).toBe(2700);
  });

  it("rejects invalid dates", () => {
    expect(() => elapsedSeconds({ startedAt: "nope", pausedAt: null, pausedSeconds: 0 }, 0)).toThrow(
      RangeError,
    );
  });
});

describe("clockOffsetMs", () => {
  it("returns server minus local", () => {
    expect(clockOffsetMs("2026-11-25T10:00:05Z", at("2026-11-25T10:00:00Z"))).toBe(5000);
    expect(clockOffsetMs("invalid", 0)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(2700)).toBe("45:00");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("00:00");
  });
});
