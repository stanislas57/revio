import { describe, expect, it } from "vitest";
import { daysBetween, formatShortDate, isIsoDate, todayIso } from "./dates";
import { formatAverage, formatCoefficient, formatGrade, formatPercent, parseDecimal } from "./format";

describe("format", () => {
  it("formats in French", () => {
    expect(formatAverage(12.345)).toBe("12,35");
    expect(formatAverage(8)).toBe("8,00");
    expect(formatCoefficient(1.5)).toBe("1,5");
    expect(formatGrade(15.5, 20)).toBe("15,5/20");
    expect(formatPercent(0.2)).toBe("20 %");
  });

  it("parses decimal commas and dots", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal(" 14.25 ")).toBe(14.25);
    expect(parseDecimal("20")).toBe(20);
    expect(parseDecimal("")).toBeNaN();
    expect(parseDecimal("12,5,3")).toBeNaN();
    expect(parseDecimal("abc")).toBeNaN();
  });
});

describe("dates", () => {
  it("counts calendar days", () => {
    expect(daysBetween("2026-11-25", "2026-11-30")).toBe(5);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-11-25", "2026-11-20")).toBe(-5);
    // Across the DST change (25 Oct 2026 in France)
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("26-11-2026")).toBe(false);
  });

  it("gives today in Paris", () => {
    // 23:30 UTC on 25 Nov = 00:30 on 26 Nov in Paris
    expect(todayIso("Europe/Paris", new Date("2026-11-25T23:30:00Z"))).toBe("2026-11-26");
  });

  it("formats short French dates", () => {
    expect(formatShortDate("2026-12-03")).toBe("jeu. 3 déc.");
  });
});
