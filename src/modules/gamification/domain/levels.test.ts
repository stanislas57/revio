import { describe, expect, it } from "vitest";
import { didLevelUp, getLevelProgress } from "./levels";

describe("getLevelProgress", () => {
  it("starts at Novice", () => {
    const p = getLevelProgress(0);
    expect(p.current.name).toBe("Novice");
    expect(p.next?.name).toBe("Apprenti");
    expect(p.xpRemaining).toBe(500);
    expect(p.percent).toBe(0);
  });

  it("matches the spec example: 4 280 XP = Challenger, 720 left, 64 %", () => {
    const p = getLevelProgress(4280);
    expect(p.current.name).toBe("Challenger");
    expect(p.next?.name).toBe("Expert");
    expect(p.xpRemaining).toBe(720);
    expect(p.percent).toBe(64);
  });

  it("switches level exactly at the threshold", () => {
    expect(getLevelProgress(499).current.level).toBe(1);
    expect(getLevelProgress(500).current.level).toBe(2);
  });

  it("caps at the last level", () => {
    const p = getLevelProgress(80_000);
    expect(p.current.name).toBe("Légende");
    expect(p.next).toBeNull();
    expect(p.percent).toBe(100);
    expect(p.xpRemaining).toBe(0);
  });

  it("treats invalid values as 0", () => {
    expect(getLevelProgress(-10).totalXp).toBe(0);
    expect(getLevelProgress(Number.NaN).totalXp).toBe(0);
  });

  it("accepts custom thresholds", () => {
    const p = getLevelProgress(15, [
      { level: 1, name: "A", minXp: 0 },
      { level: 2, name: "B", minXp: 10 },
    ]);
    expect(p.current.name).toBe("B");
  });
});

describe("didLevelUp", () => {
  it("detects a level change", () => {
    expect(didLevelUp(450, 515)).toBe(true);
    expect(didLevelUp(100, 200)).toBe(false);
  });
});
