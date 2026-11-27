import { describe, expect, it } from "vitest";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import { liveXpEstimate } from "./live-xp";

describe("liveXpEstimate", () => {
  it("earns nothing before the minimum duration, then 1 XP per minute", () => {
    expect(liveXpEstimate(0)).toBe(0);
    expect(liveXpEstimate(XP_RULES.minSessionMinutes * 60 - 1)).toBe(0);
    expect(liveXpEstimate(XP_RULES.minSessionMinutes * 60)).toBe(XP_RULES.minSessionMinutes);
    expect(liveXpEstimate(12 * 60 + 59)).toBe(12);
  });

  it("is capped per session and ignores negative time", () => {
    expect(liveXpEstimate(10 * 3600)).toBe(XP_RULES.maxCountedMinutesPerSession);
    expect(liveXpEstimate(-30)).toBe(0);
  });

  it("never adds the daily-goal or streak bonuses (the database decides them at the end)", () => {
    // 60 minutes would complete a 30-minute goal: no bonus is included in the estimate.
    expect(liveXpEstimate(60 * 60)).toBe(60);
  });

  it("matches the XP of the normal flow for the same duration (12 minutes = 12 XP)", () => {
    expect(liveXpEstimate(12 * 60)).toBe(12);
  });
});
