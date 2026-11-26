import { describe, expect, it } from "vitest";
import type { AgendaItem } from "./types";
import { relativeDayLabel, upcomingItems, upcomingWindowEnd } from "./upcoming";

const item = (date: string, title: string, startTime: string | null = null, endTime: string | null = null) =>
  ({
    key: `event:${title}`,
    source: "event",
    id: title,
    date,
    title,
    kind: "study",
    subjectId: null,
    startTime,
    endTime,
    recurring: false,
    planStatus: null,
    planReason: null,
  }) satisfies AgendaItem;

describe("upcomingItems", () => {
  const byDay = new Map<string, AgendaItem[]>([
    ["2026-11-25", [item("2026-11-25", "Hier")]],
    [
      "2026-11-26",
      [item("2026-11-26", "Fini", "08:00", "09:00"), item("2026-11-26", "Plus tard", "18:00", "19:00")],
    ],
    ["2026-11-27", [item("2026-11-27", "Demain A"), item("2026-11-27", "Demain B")]],
    ["2026-11-28", [item("2026-11-28", "Samedi")]],
  ]);

  it("starts today, skips what is over, and keeps the day order", () => {
    expect(upcomingItems(byDay, "2026-11-26", "10:00").map((i) => i.title)).toEqual([
      "Plus tard",
      "Demain A",
      "Demain B",
    ]);
  });

  it("respects the limit and returns fewer items when there are not enough", () => {
    expect(upcomingItems(byDay, "2026-11-26", "10:00", 1)).toHaveLength(1);
    expect(upcomingItems(byDay, "2026-11-28", "10:00", 5).map((i) => i.title)).toEqual(["Samedi"]);
    expect(upcomingItems(new Map(), "2026-11-26", "10:00")).toEqual([]);
  });
});

describe("relativeDayLabel", () => {
  it("names today and tomorrow, then a short French date", () => {
    expect(relativeDayLabel("2026-11-26", "2026-11-26")).toBe("Aujourd'hui");
    expect(relativeDayLabel("2026-11-27", "2026-11-26")).toBe("Demain");
    expect(relativeDayLabel("2026-12-03", "2026-11-26")).toBe("jeu. 3 déc.");
  });

  it("covers a two-week window", () => {
    expect(upcomingWindowEnd("2026-11-26")).toBe("2026-12-09");
  });
});
