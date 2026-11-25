import { describe, expect, it } from "vitest";
import { nextStreakMilestone } from "./rules";

describe("nextStreakMilestone", () => {
  it("matches the spec example: 15 days -> 21 days, 250 XP", () => {
    expect(nextStreakMilestone(15)).toEqual({ days: 21, remaining: 6, bonusXp: 250 });
  });
  it("returns the next one when exactly on a milestone", () => {
    expect(nextStreakMilestone(7)?.days).toBe(14);
  });
  it("has no bonus for milestones without XP", () => {
    expect(nextStreakMilestone(0)).toEqual({ days: 3, remaining: 3, bonusXp: null });
  });
  it("returns null after the last milestone", () => {
    expect(nextStreakMilestone(365)).toBeNull();
  });
});
