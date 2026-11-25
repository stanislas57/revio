import { describe, expect, it } from "vitest";
import { computeStreak, localDate } from "./streak";

const TZ = "Europe/Paris";
const session = (endedAt: string, minutes: number) => ({ endedAt, seconds: minutes * 60 });

describe("localDate", () => {
  it("uses the user's time zone, not UTC", () => {
    // 23:30 UTC on 25/11 is 00:30 on 26/11 in Paris (UTC+1 in winter).
    expect(localDate("2026-11-25T23:30:00Z", TZ)).toBe("2026-11-26");
    expect(localDate("2026-11-25T22:30:00Z", TZ)).toBe("2026-11-25");
  });

  it("handles daylight saving time (Paris is UTC+2 in summer)", () => {
    expect(localDate("2026-07-01T22:30:00Z", TZ)).toBe("2026-07-02");
    // Night of the switch to winter time (25/10/2026, 03:00 → 02:00).
    expect(localDate("2026-10-25T00:30:00Z", TZ)).toBe("2026-10-25");
  });
});

describe("computeStreak", () => {
  it("counts consecutive validated days ending today", () => {
    const s = computeStreak(
      [
        session("2026-11-23T18:00:00Z", 20),
        session("2026-11-24T18:00:00Z", 15),
        session("2026-11-25T18:00:00Z", 30),
      ],
      "2026-11-25",
      TZ,
    );
    expect(s).toMatchObject({ currentDays: 3, recordDays: 3, todayValidated: true, todayMinutes: 30 });
  });

  it("keeps the streak alive until the day is over", () => {
    const s = computeStreak([session("2026-11-24T18:00:00Z", 20)], "2026-11-25", TZ);
    expect(s).toMatchObject({ currentDays: 1, todayValidated: false, lastValidatedOn: "2026-11-24" });
  });

  it("breaks after a missed day and keeps the record", () => {
    const s = computeStreak(
      [
        session("2026-11-20T18:00:00Z", 20),
        session("2026-11-21T18:00:00Z", 20),
        session("2026-11-22T18:00:00Z", 20),
        session("2026-11-25T18:00:00Z", 20),
      ],
      "2026-11-25",
      TZ,
    );
    expect(s.currentDays).toBe(1);
    expect(s.recordDays).toBe(3);
  });

  it("does not validate a day under 10 minutes, but sums sessions of the same day", () => {
    expect(computeStreak([session("2026-11-25T08:00:00Z", 9)], "2026-11-25", TZ).todayValidated).toBe(false);
    expect(
      computeStreak(
        [session("2026-11-25T08:00:00Z", 6), session("2026-11-25T20:00:00Z", 5)],
        "2026-11-25",
        TZ,
      ).todayValidated,
    ).toBe(true);
  });

  it("counts a session crossing midnight for the day it ended", () => {
    // Ends at 00:20 Paris time on 26/11.
    const s = computeStreak([session("2026-11-25T23:20:00Z", 45)], "2026-11-26", TZ);
    expect(s).toMatchObject({ todayValidated: true, currentDays: 1, lastValidatedOn: "2026-11-26" });
  });

  it("returns zeros without sessions", () => {
    expect(computeStreak([], "2026-11-25", TZ)).toEqual({
      currentDays: 0,
      recordDays: 0,
      todayValidated: false,
      todayMinutes: 0,
      lastValidatedOn: null,
    });
  });
});
