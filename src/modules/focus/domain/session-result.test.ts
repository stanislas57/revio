import { describe, expect, it } from "vitest";
import { toSessionResult } from "./session-result";

const raw = {
  session_id: "s1",
  already_finalized: false,
  subject_name: null,
  duration_seconds: 2712,
  duration_minutes: 45,
  counted_minutes: 45,
  below_minimum: false,
  earned_xp: 95,
  breakdown: [
    { reason: "study_duration", xp: 45 },
    { reason: "daily_goal", xp: 50 },
  ],
  total_xp_before: 2950,
  total_xp: 3045,
  streak_days: 15,
  record_days: 24,
  day: "2026-11-25",
  today_minutes: 45,
  today_validated: true,
  daily_goal_minutes: 30,
  daily_goal_completed: true,
  post_created: true,
};

describe("toSessionResult", () => {
  it("maps the SQL summary to the contract", () => {
    const r = toSessionResult(raw);
    expect(r.earnedXp).toBe(95);
    expect(r.xpBreakdown.map((b) => b.label)).toEqual(["45 min de révision", "Objectif du jour atteint"]);
    expect(r.level.current.name).toBe("Challenger");
    expect(r.leveledUp).toBe(true);
    expect(r.streak).toMatchObject({ currentDays: 15, recordDays: 24, nextMilestone: 21 });
  });

  it("labels streak milestones", () => {
    const r = toSessionResult({
      ...raw,
      breakdown: [{ reason: "streak_milestone", xp: 100, days: 7 }],
      earned_xp: 100,
    });
    expect(r.xpBreakdown[0]?.label).toBe("Streak de 7 jours");
  });

  it("fails loudly on an unexpected shape", () => {
    expect(() => toSessionResult({ ...raw, earned_xp: "95" })).toThrow();
  });
});
