import { describe, expect, it } from "vitest";
import type { Achievement } from "../contracts";
import { FIXTURE_NOW } from "@/lib/fixtures";
import { FIXTURE_ACHIEVEMENTS_GALLERY } from "../fixtures-achievements";
import {
  ACHIEVEMENT_FILTERS,
  CATEGORY_LABEL,
  achievementState,
  applyFilter,
  countByFilter,
  isRecentlyUnlocked,
  matchesFilter,
  progressPercent,
  sortAchievements,
  stateLabel,
} from "./achievements";

const base: Achievement = {
  id: "x",
  name: "X",
  description: "d",
  category: "regularity",
  unlockedAt: null,
  progress: null,
};

describe("achievementState", () => {
  it("is unlocked as soon as there is an unlock date", () => {
    expect(achievementState({ unlockedAt: "2026-11-10T18:00:00Z", progress: null })).toBe("unlocked");
    // Even with a full progress bar, only the date makes it obtained.
    expect(achievementState({ unlockedAt: null, progress: { current: 7, target: 7 } })).toBe("in_progress");
  });
  it("is in progress once started", () => {
    expect(achievementState({ unlockedAt: null, progress: { current: 5, target: 7 } })).toBe("in_progress");
  });
  it("is locked without progress or at zero", () => {
    expect(achievementState({ unlockedAt: null, progress: null })).toBe("locked");
    expect(achievementState({ unlockedAt: null, progress: { current: 0, target: 100 } })).toBe("locked");
  });
});

describe("progressPercent", () => {
  it("floors the ratio", () => {
    expect(progressPercent({ progress: { current: 5, target: 7 } })).toBe(71);
    expect(progressPercent({ progress: { current: 1, target: 3 } })).toBe(33);
  });
  it("is null without progress", () => {
    expect(progressPercent({ progress: null })).toBeNull();
  });
  it("never leaves 0..100 and survives a zero target", () => {
    expect(progressPercent({ progress: { current: 20, target: 10 } })).toBe(100);
    expect(progressPercent({ progress: { current: -3, target: 10 } })).toBe(0);
    expect(progressPercent({ progress: { current: 3, target: 0 } })).toBe(0);
    expect(progressPercent({ progress: { current: Number.NaN, target: 10 } })).toBe(0);
  });
});

describe("isRecentlyUnlocked", () => {
  it("is true within 7 days and false after", () => {
    expect(isRecentlyUnlocked({ unlockedAt: "2026-11-24T20:00:00Z" }, FIXTURE_NOW)).toBe(true);
    expect(isRecentlyUnlocked({ unlockedAt: "2026-11-10T18:00:00Z" }, FIXTURE_NOW)).toBe(false);
  });
  it("is false when not unlocked, in the future, or on a bad date", () => {
    expect(isRecentlyUnlocked({ unlockedAt: null }, FIXTURE_NOW)).toBe(false);
    expect(isRecentlyUnlocked({ unlockedAt: "2026-12-30T00:00:00Z" }, FIXTURE_NOW)).toBe(false);
    expect(isRecentlyUnlocked({ unlockedAt: "not a date" }, FIXTURE_NOW)).toBe(false);
  });
});

describe("filters", () => {
  const list = FIXTURE_ACHIEVEMENTS_GALLERY;

  it("offers the seven filters in the requested order", () => {
    expect(ACHIEVEMENT_FILTERS.map((f) => f.label)).toEqual([
      "Tous",
      "Débloqués",
      "À débloquer",
      "Régularité",
      "Progression",
      "Social",
      "Performance",
    ]);
  });

  it("maps every contract category to exactly one filter", () => {
    const categories = ACHIEVEMENT_FILTERS.flatMap((f) => (f.category ? [f.category] : [])).sort();
    expect(categories).toEqual(["level", "regularity", "social", "volume"]);
    expect(Object.keys(CATEGORY_LABEL).sort()).toEqual(categories);
  });

  it("'all' keeps everything", () => {
    expect(applyFilter(list, "all")).toHaveLength(list.length);
  });

  it("'unlocked' and 'locked' split the list without overlap", () => {
    const unlocked = applyFilter(list, "unlocked");
    const locked = applyFilter(list, "locked");
    expect(unlocked.length + locked.length).toBe(list.length);
    expect(unlocked.every((a) => a.unlockedAt)).toBe(true);
    expect(locked.every((a) => !a.unlockedAt)).toBe(true);
  });

  it("'À débloquer' includes achievements in progress", () => {
    expect(matchesFilter({ ...base, progress: { current: 5, target: 7 } }, "locked")).toBe(true);
  });

  it("category filters use the contract's categories", () => {
    expect(applyFilter(list, "progression").every((a) => a.category === "level")).toBe(true);
    expect(applyFilter(list, "performance").every((a) => a.category === "volume")).toBe(true);
    expect(applyFilter(list, "regularity").every((a) => a.category === "regularity")).toBe(true);
    expect(applyFilter(list, "social").every((a) => a.category === "social")).toBe(true);
  });

  it("counts match the filtered lists", () => {
    const counts = countByFilter(list);
    for (const f of ACHIEVEMENT_FILTERS) expect(counts[f.id]).toBe(applyFilter(list, f.id).length);
  });

  it("does not mutate the list it filters", () => {
    const copy = [...list];
    applyFilter(list, "social");
    expect(list).toEqual(copy);
  });
});

describe("sortAchievements", () => {
  it("puts obtained first (newest first), then in progress (closest first), then locked", () => {
    const sorted = sortAchievements(FIXTURE_ACHIEVEMENTS_GALLERY);
    const states = sorted.map(achievementState);
    const firstInProgress = states.indexOf("in_progress");
    const firstLocked = states.indexOf("locked");
    expect(states.slice(0, firstInProgress).every((s) => s === "unlocked")).toBe(true);
    expect(states.slice(firstInProgress, firstLocked).every((s) => s === "in_progress")).toBe(true);
    expect(states.slice(firstLocked).every((s) => s === "locked")).toBe(true);
    expect(sorted[0]?.id).toBe("weekly_goal");
    const pct = sorted
      .filter((a) => achievementState(a) === "in_progress")
      .map((a) => progressPercent(a) ?? 0);
    expect(pct).toEqual([...pct].sort((a, b) => b - a));
  });
});

describe("fixtures", () => {
  it("have unique ids and cover every category and every state", () => {
    const ids = FIXTURE_ACHIEVEMENTS_GALLERY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(FIXTURE_ACHIEVEMENTS_GALLERY.map((a) => a.category))).toEqual(
      new Set(["regularity", "volume", "social", "level"]),
    );
    expect(new Set(FIXTURE_ACHIEVEMENTS_GALLERY.map(achievementState))).toEqual(
      new Set(["locked", "in_progress", "unlocked"]),
    );
  });
  it("never expose a grade, an average or a subject", () => {
    const text = JSON.stringify(FIXTURE_ACHIEVEMENTS_GALLERY).toLowerCase();
    for (const word of ["moyenne", "note de", "matière"]) expect(text).not.toContain(word);
  });
});

describe("stateLabel", () => {
  it("is in French", () => {
    expect(stateLabel("locked")).toBe("Verrouillé");
    expect(stateLabel("in_progress")).toBe("En cours");
    expect(stateLabel("unlocked")).toBe("Débloqué");
  });
});
