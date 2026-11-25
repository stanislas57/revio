import { describe, expect, it } from "vitest";
import { FIXTURE_STUDY_STATS } from "../fixtures";
import { FIXTURE_STUDY_STATS_30D, FIXTURE_STUDY_STATS_EMPTY } from "../fixtures-stats";
import {
  heatmapColumns,
  intensityLevel,
  isEmptyStats,
  longDay,
  mondayOf,
  plainDay,
  shortDay,
  weekBins,
  weekdayIndex,
} from "./stats-view";

describe("weekdayIndex and mondayOf", () => {
  it("numbers the week from Monday (0) to Sunday (6)", () => {
    expect(weekdayIndex("2026-11-23")).toBe(0); // Monday
    expect(weekdayIndex("2026-11-25")).toBe(2); // Wednesday
    expect(weekdayIndex("2026-11-29")).toBe(6); // Sunday
  });
  it("finds the Monday of any day, across months and years", () => {
    expect(mondayOf("2026-11-25")).toBe("2026-11-23");
    expect(mondayOf("2026-11-29")).toBe("2026-11-23");
    expect(mondayOf("2026-11-30")).toBe("2026-11-30");
    expect(mondayOf("2027-01-01")).toBe("2026-12-28");
  });
});

describe("weekBins", () => {
  const bins = weekBins(FIXTURE_STUDY_STATS_30D.daily);

  it("keeps the total of the series (a re-binning, not a new statistic)", () => {
    const sum = (xs: readonly { minutes: number }[]) => xs.reduce((a, x) => a + x.minutes, 0);
    expect(sum(bins)).toBe(sum(FIXTURE_STUDY_STATS_30D.daily));
    expect(bins.reduce((a, b) => a + b.xp, 0)).toBe(
      FIXTURE_STUDY_STATS_30D.daily.reduce((a, d) => a + d.xp, 0),
    );
    expect(bins.reduce((a, b) => a + b.days, 0)).toBe(30);
  });

  it("starts every bin on a Monday, in order", () => {
    expect(bins.every((b) => weekdayIndex(b.weekStart) === 0)).toBe(true);
    expect(bins.map((b) => b.weekStart)).toEqual([...bins.map((b) => b.weekStart)].sort());
  });

  it("marks the weeks the 30 days only partly cover", () => {
    // 2026-10-27 is a Tuesday and 2026-11-25 a Wednesday: first and last weeks are partial.
    expect(bins[0]).toMatchObject({ weekStart: "2026-10-26", days: 6, partial: true });
    expect(bins.at(-1)).toMatchObject({ weekStart: "2026-11-23", days: 3, partial: true });
    expect(bins.slice(1, -1).every((b) => b.days === 7 && !b.partial)).toBe(true);
  });

  it("copes with an empty series and an unsorted one", () => {
    expect(weekBins([])).toEqual([]);
    const shuffled = [...FIXTURE_STUDY_STATS_30D.daily].reverse();
    expect(weekBins(shuffled)).toEqual(bins);
  });
});

describe("intensityLevel", () => {
  it("follows the display scale", () => {
    expect([0, 0.5, 1, 14, 15, 29, 30, 59, 60, 600].map(intensityLevel)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3, 4, 4,
    ]);
  });
  it("survives bad values", () => {
    expect(intensityLevel(Number.NaN)).toBe(0);
    expect(intensityLevel(-5)).toBe(0);
  });
});

describe("heatmapColumns", () => {
  const cols = heatmapColumns(FIXTURE_STUDY_STATS_30D.daily);

  it("makes one column of seven rows per week", () => {
    expect(cols).toHaveLength(5); // 6 + 7 + 7 + 7 + 3 days
    expect(cols.every((c) => c.length === 7)).toBe(true);
  });

  it("puts Monday on the top row and pads the days outside the series", () => {
    // The series starts on a Tuesday: the Monday before it is padding.
    expect(cols[0]![0]).toMatchObject({ date: null, minutes: 0, level: 0 });
    expect(cols[0]![1]!.date).toBe("2026-10-27");
    // It ends on a Wednesday: Thursday to Sunday are padding.
    expect(
      cols
        .at(-1)!
        .slice(3)
        .every((c) => c.date === null),
    ).toBe(true);
  });

  it("contains each day of the series exactly once, with its minutes", () => {
    const cells = cols.flat().filter((c) => c.date !== null);
    expect(cells).toHaveLength(30);
    expect(new Set(cells.map((c) => c.date)).size).toBe(30);
    for (const d of FIXTURE_STUDY_STATS_30D.daily) {
      expect(cells.find((c) => c.date === d.date)?.minutes).toBe(d.minutes);
    }
  });

  it("is empty for an empty series", () => {
    expect(heatmapColumns([])).toEqual([]);
  });
});

describe("isEmptyStats", () => {
  it("is true only when there is no session and no activity", () => {
    expect(isEmptyStats(FIXTURE_STUDY_STATS_EMPTY)).toBe(true);
    expect(isEmptyStats(FIXTURE_STUDY_STATS_30D)).toBe(false);
    expect(isEmptyStats(FIXTURE_STUDY_STATS)).toBe(false);
  });
});

describe("day labels", () => {
  it("are in French", () => {
    expect(shortDay("2026-11-24")).toMatch(/24 nov/);
    expect(longDay("2026-11-24")).toBe("mardi 24 novembre");
    // Inside a sentence there must be no dot left to double the full stop: "du 27 oct au 25 nov."
    expect(plainDay("2026-11-24")).toBe("24 nov");
    expect(plainDay("2026-05-24")).toBe("24 mai");
    expect(plainDay("2026-10-24").endsWith(".")).toBe(false);
  });
});

describe("fixtures", () => {
  it("have 30 contiguous days in order, as the contract says", () => {
    const days = FIXTURE_STUDY_STATS_30D.daily.map((d) => d.date);
    expect(days).toHaveLength(30);
    for (let i = 1; i < days.length; i++) {
      expect(Date.parse(days[i]!) - Date.parse(days[i - 1]!)).toBe(86_400_000);
    }
    expect(days.at(-1)).toBe("2026-11-25");
  });
  it("include days without any session, so the charts show gaps", () => {
    expect(FIXTURE_STUDY_STATS_30D.daily.some((d) => d.minutes === 0)).toBe(true);
    expect(FIXTURE_STUDY_STATS_30D.daily.some((d) => d.minutes >= 60)).toBe(true);
  });
});
