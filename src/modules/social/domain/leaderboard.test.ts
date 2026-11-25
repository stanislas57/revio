import { describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { FIXTURE_LEADERBOARD_WEEK, FIXTURE_LEADERBOARD_WEEK_FROM_FOURTH } from "../fixtures-leaderboard";
import {
  PERIODS,
  afterPodium,
  byRank,
  formatTimeLeft,
  formatWeekEnd,
  gapToNext,
  myEntry,
  rankLabel,
  startOfLocalDay,
  timeLeft,
  topThree,
  weekEnd,
} from "./leaderboard";

describe("weekEnd (next Monday 00:00 in the user's time zone)", () => {
  it("on a Wednesday in Paris (winter): Monday 30 November 00:00 CET", () => {
    expect(weekEnd("2026-11-25T17:30:00Z", "Europe/Paris").toISOString()).toBe("2026-11-29T23:00:00.000Z");
  });

  it("on Sunday 23:59 Paris: one minute left", () => {
    const end = weekEnd("2026-11-29T22:59:00Z", "Europe/Paris");
    expect(end.toISOString()).toBe("2026-11-29T23:00:00.000Z");
    expect(timeLeft("2026-11-29T22:59:00Z", end).minutes).toBe(1);
  });

  it("on Monday 00:00 sharp a new week starts: seven days left", () => {
    const end = weekEnd("2026-11-29T23:00:00Z", "Europe/Paris"); // Monday 00:00 CET
    expect(end.toISOString()).toBe("2026-12-06T23:00:00.000Z");
  });

  it("follows the user's day, not UTC: Sunday 23:30 UTC is already Monday in Paris", () => {
    expect(weekEnd("2026-11-29T23:30:00Z", "Europe/Paris").toISOString()).toBe("2026-12-06T23:00:00.000Z");
    expect(weekEnd("2026-11-29T23:30:00Z", "UTC").toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });

  it("handles the end of daylight saving time (week of 26 October 2026)", () => {
    // Paris goes back to CET on Sunday 25 October: Monday 26 00:00 is 23:00 UTC the day before.
    expect(weekEnd("2026-10-22T10:00:00Z", "Europe/Paris").toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("handles the start of daylight saving time (week of 30 March 2026)", () => {
    // Paris moves to CEST on Sunday 29 March: Monday 30 00:00 is 22:00 UTC the day before.
    expect(weekEnd("2026-03-25T10:00:00Z", "Europe/Paris").toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("works in another time zone (La Réunion, UTC+4)", () => {
    expect(weekEnd("2026-11-25T17:30:00Z", "Indian/Reunion").toISOString()).toBe("2026-11-29T20:00:00.000Z");
  });

  it("crosses a year boundary", () => {
    expect(weekEnd("2026-12-30T12:00:00Z", "Europe/Paris").toISOString()).toBe("2027-01-03T23:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(() => weekEnd("not a date", "Europe/Paris")).toThrow(RangeError);
  });
});

describe("formatWeekEnd", () => {
  it("writes Monday 00:00 in the user's zone, whatever the browser's zone", () => {
    const end = weekEnd("2026-11-25T17:30:00Z", "Europe/Paris");
    expect(formatWeekEnd(end, "Europe/Paris")).toBe("lundi 30 novembre à 00:00");
    // The same instant seen from UTC is Sunday 23:00: showing that to a Paris user would be wrong.
    expect(formatWeekEnd(end, "UTC")).toBe("dimanche 29 novembre à 23:00");
  });
});

describe("startOfLocalDay", () => {
  it("is the instant the local day begins", () => {
    expect(startOfLocalDay("2026-07-14", "Europe/Paris").toISOString()).toBe("2026-07-13T22:00:00.000Z");
    expect(startOfLocalDay("2026-11-30", "Europe/Paris").toISOString()).toBe("2026-11-29T23:00:00.000Z");
  });
});

describe("timeLeft and formatTimeLeft", () => {
  const end = new Date("2026-11-29T23:00:00Z");

  it("splits days, hours and minutes", () => {
    const left = timeLeft("2026-11-25T17:30:00Z", end);
    expect(left).toMatchObject({ days: 4, hours: 5, minutes: 30 });
    expect(formatTimeLeft(left)).toBe("4 j 5 h");
  });

  it("shows hours and minutes under a day, minutes under an hour", () => {
    expect(formatTimeLeft(timeLeft("2026-11-29T17:48:00Z", end))).toBe("5 h 12 min");
    expect(formatTimeLeft(timeLeft("2026-11-29T22:48:00Z", end))).toBe("12 min");
    expect(formatTimeLeft(timeLeft("2026-11-29T22:59:30Z", end))).toBe("moins d'une minute");
  });

  it("is finished at and after the end, never negative", () => {
    expect(formatTimeLeft(timeLeft("2026-11-29T23:00:00Z", end))).toBe("terminé");
    expect(timeLeft("2026-12-05T00:00:00Z", end).totalMs).toBe(0);
  });
});

describe("podium and my position", () => {
  const board = FIXTURE_LEADERBOARD_WEEK;

  it("takes the three first, in reading order", () => {
    expect(topThree(board).map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(topThree([...board].reverse()).map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("copes with fewer than three people", () => {
    expect(topThree(board.slice(0, 2)).map((e) => e.rank)).toEqual([1, 2]);
    expect(topThree(board.slice(0, 1)).map((e) => e.rank)).toEqual([1]);
    expect(topThree([])).toEqual([]);
  });

  it("sorts by rank whatever the input order", () => {
    expect(byRank([...board].reverse()).map((e) => e.rank)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("lists everyone after the podium", () => {
    expect(afterPodium(board).map((e) => e.rank)).toEqual([4, 5, 6]);
  });

  it("finds my entry, or null when I am not in the list (I left)", () => {
    expect(myEntry(board)?.user.username).toBe("stani");
    expect(myEntry(board.map((e) => ({ ...e, isMe: false })))).toBeNull();
  });

  it("tells how much XP is missing to pass the person above (second: 640 - 515, plus one)", () => {
    expect(gapToNext(board)).toMatchObject({ xp: 126 });
    expect(gapToNext(board)?.entry.user.displayName).toBe("Charles");
  });

  it("has no gap when first or not ranked", () => {
    const first = board.map((e) => ({ ...e, isMe: e.rank === 1 }));
    expect(gapToNext(first)).toBeNull();
    expect(gapToNext(board.map((e) => ({ ...e, isMe: false })))).toBeNull();
  });

  it("works for someone below the podium", () => {
    expect(myEntry(FIXTURE_LEADERBOARD_WEEK_FROM_FOURTH)?.rank).toBe(4);
    expect(gapToNext(FIXTURE_LEADERBOARD_WEEK_FROM_FOURTH)?.entry.rank).toBe(3);
  });

  it("labels ranks in French", () => {
    expect([1, 2, 3, 4].map(rankLabel)).toEqual(["1er", "2e", "3e", "4e"]);
  });

  it("does not mutate its input", () => {
    const copy = [...board];
    topThree(board);
    afterPodium(board);
    expect(board).toEqual(copy);
  });
});

describe("what a leaderboard may contain", () => {
  it("lists the four periods of the product brief", () => {
    expect(PERIODS.map((p) => p.label)).toEqual([
      "Aujourd'hui",
      "Cette semaine",
      "Ce mois-ci",
      "Depuis le début",
    ]);
  });

  it("carries XP only: no grade, average or subject in the sample data", () => {
    const keys = new Set(FIXTURE_LEADERBOARD_WEEK.flatMap((e: LeaderboardEntry) => Object.keys(e)));
    expect([...keys].sort()).toEqual(["isMe", "rank", "user", "weeklyXp"]);
    const text = JSON.stringify(FIXTURE_LEADERBOARD_WEEK).toLowerCase();
    for (const word of ["moyenne", "note", "matière", "grade"]) expect(text).not.toContain(word);
  });

  it("has exactly one 'me' and unique ranks", () => {
    expect(FIXTURE_LEADERBOARD_WEEK.filter((e) => e.isMe)).toHaveLength(1);
    const ranks = FIXTURE_LEADERBOARD_WEEK.map((e) => e.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});
