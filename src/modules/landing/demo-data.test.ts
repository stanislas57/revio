import { describe, expect, it } from "vitest";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import {
  DEMO_CARDS,
  DEMO_DAILY,
  DEMO_FRIENDS_LIVE,
  DEMO_LEVEL,
  DEMO_SESSION_XP,
  DEMO_STREAK,
  DEMO_TROPHIES,
  DEMO_WEEK_MINUTES,
} from "./demo-data";

describe("landing demo data follows the real rules", () => {
  it("is Challenger at 4 280 XP, 64 % towards Expert, 720 XP missing", () => {
    expect(DEMO_LEVEL.current.name).toBe("Challenger");
    expect(DEMO_LEVEL.next?.name).toBe("Expert");
    expect(Math.floor(DEMO_LEVEL.progress * 100)).toBe(64);
    expect(DEMO_LEVEL.xpUntilNextLevel).toBe(720);
  });

  it("has a 15-day streak made of 15 validated days in a row, ending with a rest day before", () => {
    const valid = (m: number) => m >= XP_RULES.streakDayMinutes;
    let run = 0;
    for (const d of [...DEMO_DAILY].reverse()) {
      if (!valid(d.minutes)) break;
      run++;
    }
    expect(run).toBe(DEMO_STREAK.currentDays);
    expect(DEMO_STREAK.nextMilestone).toBe(21);
    expect(DEMO_STREAK.recordDays).toBeGreaterThan(DEMO_STREAK.currentDays);
  });

  it("has exactly 30 consecutive days and 12 h 30 over the last 7", () => {
    expect(DEMO_DAILY).toHaveLength(30);
    for (let i = 1; i < DEMO_DAILY.length; i++) {
      const gap = Date.parse(DEMO_DAILY[i]!.date) - Date.parse(DEMO_DAILY[i - 1]!.date);
      expect(gap).toBe(86_400_000);
    }
    expect(DEMO_WEEK_MINUTES).toBe(750);
  });

  it("ends a 65-minute session with +115 XP (1 XP per minute + the daily goal bonus)", () => {
    expect(DEMO_SESSION_XP).toBe(65 + XP_RULES.dailyGoalBonus);
    expect(DEMO_SESSION_XP).toBe(115);
  });

  it("shows one trophy per state", () => {
    expect(DEMO_TROPHIES.map((t) => t.label)).toEqual(["Débloqué", "En cours", "Verrouillé"]);
    expect(DEMO_TROPHIES[0]!.achievement.unlockedAt).not.toBeNull();
    expect(DEMO_TROPHIES[1]!.achievement.progress?.current).toBeGreaterThan(0);
    expect(DEMO_TROPHIES[2]!.achievement.progress?.current).toBe(0);
  });

  it("has the six hero cards, with unique ids, and a count that matches the friends list", () => {
    expect(DEMO_CARDS).toHaveLength(6);
    expect(new Set(DEMO_CARDS.map((c) => c.id)).size).toBe(6);
    expect(DEMO_CARDS.find((c) => c.id === "amis")?.value).toBe(String(DEMO_FRIENDS_LIVE.length));
  });

  it("never carries a real e-mail, a link or a price", () => {
    const text = JSON.stringify([DEMO_CARDS, DEMO_FRIENDS_LIVE]);
    expect(text).not.toMatch(/@|https?:|€/);
  });
});
