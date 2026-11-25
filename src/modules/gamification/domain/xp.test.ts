import { describe, expect, it } from "vitest";
import { computeSessionXp, type SessionXpInput } from "./xp";

const base: SessionXpInput = {
  durationSeconds: 45 * 60,
  durationXpToday: 0,
  minutesToday: 0,
  dailyGoalMinutes: 30,
  dailyGoalAlreadyAwarded: false,
  streakDaysAfter: 1,
  streakBonusesAwarded: [],
};

describe("computeSessionXp", () => {
  it("45 min + daily goal = 95 XP (spec example without planned-session bonus)", () => {
    const xp = computeSessionXp(base);
    expect(xp.total).toBe(95);
    expect(xp.breakdown.map((b) => b.reason)).toEqual(["study_duration", "daily_goal"]);
    expect(xp.dailyGoalCompleted).toBe(true);
  });

  it("gives nothing under 5 minutes, even if the goal would be reached", () => {
    const xp = computeSessionXp({ ...base, durationSeconds: 4 * 60 + 59, minutesToday: 29 });
    expect(xp).toMatchObject({ belowMinimum: true, total: 0, countedMinutes: 0, dailyGoalCompleted: false });
  });

  it("caps counted minutes per session", () => {
    const xp = computeSessionXp({ ...base, durationSeconds: 5 * 3600 });
    expect(xp.durationMinutes).toBe(300);
    expect(xp.countedMinutes).toBe(180);
  });

  it("caps duration XP per day", () => {
    const xp = computeSessionXp({ ...base, durationXpToday: 280, dailyGoalAlreadyAwarded: true });
    expect(xp.total).toBe(20);
  });

  it("awards the daily goal only once", () => {
    expect(computeSessionXp({ ...base, minutesToday: 40, dailyGoalAlreadyAwarded: true }).total).toBe(45);
  });

  it("reaches the goal across several sessions", () => {
    const xp = computeSessionXp({ ...base, durationSeconds: 10 * 60, minutesToday: 25 });
    expect(xp.total).toBe(60);
  });

  it("adds a streak milestone bonus once", () => {
    expect(computeSessionXp({ ...base, streakDaysAfter: 7 }).total).toBe(195);
    expect(computeSessionXp({ ...base, streakDaysAfter: 7, streakBonusesAwarded: [7] }).total).toBe(95);
    expect(computeSessionXp({ ...base, streakDaysAfter: 8 }).total).toBe(95);
  });

  it("ignores negative durations", () => {
    expect(computeSessionXp({ ...base, durationSeconds: -100 }).total).toBe(0);
  });
});
