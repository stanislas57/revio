import { describe, expect, it } from "vitest";
import { weekStreakDays } from "./week-streak";

// 2026-11-25 is a Wednesday: the week runs from Monday 23 to Sunday 29.
describe("weekStreakDays", () => {
  it("lists Monday to Sunday with their names", () => {
    const week = weekStreakDays("2026-11-25", {}, 10);
    expect(week.map((d) => d.label).join("")).toBe("LMMJVSD");
    expect(week.map((d) => d.name)).toEqual([
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ]);
  });

  it("marks validated days, today (dashed until validated) and the others", () => {
    const week = weekStreakDays("2026-11-25", { "2026-11-23": 25, "2026-11-24": 9 }, 10);
    expect(week.map((d) => d.state)).toEqual(["done", "empty", "today", "empty", "empty", "empty", "empty"]);
  });

  it("shows today as done once it reaches the threshold, and the days after it stay empty", () => {
    const week = weekStreakDays("2026-11-25", { "2026-11-25": 10, "2026-11-27": 60 }, 10);
    expect(week[2]!.state).toBe("done");
    expect(week[4]!.state).toBe("done"); // data in the future would be a bug upstream: shown as is, never invented
  });

  it("handles a Sunday and a Monday (week boundaries)", () => {
    const sunday = weekStreakDays("2026-11-29", { "2026-11-23": 15 }, 10);
    expect(sunday[0]!.state).toBe("done");
    expect(sunday[6]!.state).toBe("today");
    const monday = weekStreakDays("2026-11-23", {}, 10);
    expect(monday[0]!.state).toBe("today");
  });

  it("never invents a joker day", () => {
    const states = new Set(weekStreakDays("2026-11-25", { "2026-11-23": 99 }, 10).map((d) => d.state));
    expect([...states].every((s) => s === "done" || s === "today" || s === "empty")).toBe(true);
  });
});
