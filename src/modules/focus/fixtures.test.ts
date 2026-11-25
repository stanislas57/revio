import { describe, expect, it } from "vitest";
import { levelProgress } from "@/modules/gamification/domain/levels";
import {
  FIXTURE_SESSION_RESULT,
  FIXTURE_SESSION_RESULT_LEVEL_UP,
  FIXTURE_SESSION_RESULT_TOO_SHORT,
} from "./fixtures";

// Keeps sample data coherent, so the UI built on it matches the real engine.
describe("session result fixtures", () => {
  for (const result of [
    FIXTURE_SESSION_RESULT,
    FIXTURE_SESSION_RESULT_LEVEL_UP,
    FIXTURE_SESSION_RESULT_TOO_SHORT,
  ]) {
    it(`${result.earnedXp} XP equals the breakdown and level matches total XP`, () => {
      expect(result.xpBreakdown.reduce((sum, item) => sum + item.xp, 0)).toBe(result.earnedXp);
      expect(levelProgress(result.level.totalXp)).toEqual(result.level);
    });
  }

  it("level-up fixture actually crosses a level", () => {
    const before = levelProgress(
      FIXTURE_SESSION_RESULT_LEVEL_UP.level.totalXp - FIXTURE_SESSION_RESULT_LEVEL_UP.earnedXp,
    );
    expect(before.current.number).toBeLessThan(FIXTURE_SESSION_RESULT_LEVEL_UP.level.current.number);
  });
});
