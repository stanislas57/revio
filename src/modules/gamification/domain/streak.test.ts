import { describe, expect, it } from "vitest";
import { buildStreakSummary, effectiveStreakDays, lastDays, parisDay } from "./streak";

describe("effectiveStreakDays", () => {
  it("keeps the streak when the last validated day is today or yesterday", () => {
    expect(effectiveStreakDays(15, "2026-11-25", "2026-11-25")).toBe(15);
    expect(effectiveStreakDays(15, "2026-11-24", "2026-11-25")).toBe(15);
  });
  it("resets after a missed day, without touching the record", () => {
    expect(effectiveStreakDays(15, "2026-11-23", "2026-11-25")).toBe(0);
  });
  it("is 0 without any validated day", () => {
    expect(effectiveStreakDays(0, null, "2026-11-25")).toBe(0);
    expect(effectiveStreakDays(3, null, "2026-11-25")).toBe(0);
  });
  it("handles month and year boundaries", () => {
    expect(effectiveStreakDays(4, "2026-12-31", "2027-01-01")).toBe(4);
  });
});

describe("lastDays", () => {
  it("lists days oldest first, ending today", () => {
    expect(lastDays("2026-11-02", 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });
});

describe("parisDay", () => {
  it("uses the Paris calendar day (23:30 UTC is already tomorrow in winter)", () => {
    expect(parisDay(new Date("2026-11-25T23:30:00Z"))).toBe("2026-11-26");
    expect(parisDay(new Date("2026-11-25T10:00:00Z"))).toBe("2026-11-25");
  });
});

describe("buildStreakSummary", () => {
  it("matches the spec example: 15 days, record 24, next milestone 21", () => {
    const s = buildStreakSummary(
      { current_streak: 15, best_streak: 24, last_validated_on: "2026-11-25" },
      45,
      "2026-11-25",
    );
    expect(s).toMatchObject({
      currentDays: 15,
      recordDays: 24,
      todayValidated: true,
      dailyGoalCompleted: true,
      nextMilestone: 21,
    });
  });
  it("does not validate the day under 10 minutes", () => {
    const s = buildStreakSummary(
      { current_streak: 3, best_streak: 3, last_validated_on: "2026-11-24" },
      4,
      "2026-11-25",
    );
    expect(s.todayValidated).toBe(false);
    expect(s.currentDays).toBe(3);
  });
});
