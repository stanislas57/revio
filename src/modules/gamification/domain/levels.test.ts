import { describe, expect, it } from "vitest";
import { levelProgress, nextStreakMilestone } from "./levels";

describe("levelProgress", () => {
  it("matches the spec example (4 280 XP)", () => {
    const p = levelProgress(4280);
    expect(p.current.name).toBe("Challenger");
    expect(p.next?.name).toBe("Expert");
    expect(p.xpIntoLevel).toBe(1280);
    expect(p.xpUntilNextLevel).toBe(720);
    expect(p.progress).toBeCloseTo(0.64);
  });

  it("starts at Novice with 0 XP and clamps negatives", () => {
    expect(levelProgress(0).current.number).toBe(1);
    expect(levelProgress(-10).totalXp).toBe(0);
  });

  it("switches level exactly at the threshold", () => {
    expect(levelProgress(499).current.number).toBe(1);
    expect(levelProgress(500).current.number).toBe(2);
    expect(levelProgress(500).progress).toBe(0);
  });

  it("has no next level at Légende", () => {
    const p = levelProgress(80000);
    expect(p.current.name).toBe("Légende");
    expect(p.next).toBeNull();
    expect(p.xpUntilNextLevel).toBeNull();
    expect(p.progress).toBe(1);
  });

  it("rejects non-finite values", () => {
    expect(() => levelProgress(Number.NaN)).toThrow(RangeError);
  });
});

describe("nextStreakMilestone", () => {
  it("returns the next milestone strictly above", () => {
    expect(nextStreakMilestone(0)).toBe(3);
    expect(nextStreakMilestone(7)).toBe(14);
    expect(nextStreakMilestone(15)).toBe(21);
    expect(nextStreakMilestone(365)).toBeNull();
  });
});
