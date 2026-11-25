import { describe, expect, it } from "vitest";
import { formatMinutes } from "./format";

describe("formatMinutes", () => {
  it("formats durations", () => {
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 h");
    expect(formatMinutes(80)).toBe("1 h 20");
    expect(formatMinutes(-5)).toBe("0 min");
  });
});
