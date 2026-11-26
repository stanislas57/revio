import { describe, expect, it } from "vitest";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import { DEMO_FEED, DEMO_FRIENDS_LIVE, DEMO_LEVEL, DEMO_SESSION_XP } from "./demo-data";

describe("landing demo data follows the real rules", () => {
  it("is Challenger at 4 280 XP, 64 % towards Expert, 720 XP missing", () => {
    expect(DEMO_LEVEL.current.name).toBe("Challenger");
    expect(DEMO_LEVEL.next?.name).toBe("Expert");
    expect(Math.floor(DEMO_LEVEL.progress * 100)).toBe(64);
    expect(DEMO_LEVEL.xpUntilNextLevel).toBe(720);
  });

  it("ends a 65-minute session with +115 XP (1 XP per minute + the daily goal bonus)", () => {
    expect(DEMO_SESSION_XP).toBe(65 + XP_RULES.dailyGoalBonus);
    expect(DEMO_SESSION_XP).toBe(115);
  });

  it("never carries a real e-mail, a link or a price", () => {
    const text = JSON.stringify([DEMO_FRIENDS_LIVE, DEMO_FEED]);
    expect(text).not.toMatch(/@|https?:|€/);
  });
});
