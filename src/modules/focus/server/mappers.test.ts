import { describe, expect, it } from "vitest";
import { toActiveSession, toSessionResult } from "./mappers";

const stored = {
  sessionId: "s1",
  subjectName: "Statistiques",
  durationMinutes: 45,
  countedMinutes: 45,
  belowMinimum: false,
  earnedXp: 95,
  xpBreakdown: [{ reason: "study_duration" as const, xp: 45, label: "45 min de révision" }],
  totalXp: 4280,
  dailyGoalCompleted: true,
  streak: {
    currentDays: 15,
    recordDays: 24,
    todayValidated: true,
    todayMinutes: 45,
    dailyGoalMinutes: 30,
    dailyGoalCompleted: true,
    lastValidatedOn: "2026-11-25",
  },
  postCreated: true,
  alreadyFinalized: false,
};

describe("toSessionResult", () => {
  it("derives level and next milestone from the stored totals", () => {
    const r = toSessionResult(stored);
    expect(r.level.current.name).toBe("Challenger");
    expect(r.level.xpUntilNextLevel).toBe(720);
    expect(r.streak.nextMilestone).toBe(21);
    expect(r.leveledUp).toBe(false);
  });
  it("detects a level up from the XP earned by the session", () => {
    expect(toSessionResult({ ...stored, totalXp: 510, earnedXp: 95 }).leveledUp).toBe(true);
  });
});

describe("toActiveSession", () => {
  const row = {
    id: "a",
    mode: "free" as const,
    status: "in_progress" as const,
    visibility: "friends" as const,
    label: "Droit",
    planned_minutes: null,
    started_at: "2026-11-25T10:00:00Z",
    ended_at: null,
    paused_at: null,
    paused_seconds: 0,
    subject_id: null,
  };
  it("reports running and paused states", () => {
    expect(toActiveSession(row).status).toBe("running");
    expect(toActiveSession({ ...row, paused_at: "2026-11-25T10:10:00Z" }).status).toBe("paused");
  });
});
