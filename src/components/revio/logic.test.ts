import { describe, expect, it } from "vitest";
import {
  addXp,
  allQuestsDone,
  canSendKudos,
  chestJustOpened,
  claimDaily,
  clamp01,
  dayKey,
  formatClock,
  nextStack,
  placesGained,
  questDone,
  questProgress,
  rankLeague,
  recordKudos,
  ringGeometry,
  type LeagueRow,
  type Quest,
} from "./logic";

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe("ringGeometry", () => {
  it("draws the base and the lime gain end to end on the circumference", () => {
    const g = ringGeometry(100, 10, 0.64, 0.1);
    expect(g.radius).toBe(45);
    expect(g.baseLength + g.gainLength).toBeCloseTo(0.64 * g.circumference);
    expect(g.gainLength).toBeCloseTo(0.1 * g.circumference);
    expect(g.gainOffset).toBeCloseTo(-0.54 * g.circumference);
    expect(g.percent).toBe(64);
  });
  it("never draws more gain than progress, and clamps garbage", () => {
    expect(ringGeometry(100, 10, 0.05, 0.5).gainLength).toBeCloseTo(
      0.05 * ringGeometry(100, 10, 0, 0).circumference,
    );
    expect(ringGeometry(100, 10, 3).percent).toBe(100);
    expect(ringGeometry(100, 10, -1).percent).toBe(0);
    expect(ringGeometry(100, 10, Number.NaN).percent).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
  });
});

describe("once a day", () => {
  it("plays a celebration once per day and per key, then again the next day", () => {
    const store = memory();
    expect(claimDaily(store, "quests", "2026-11-25")).toBe(true);
    expect(claimDaily(store, "quests", "2026-11-25")).toBe(false);
    expect(claimDaily(store, "level", "2026-11-25")).toBe(true);
    expect(claimDaily(store, "quests", "2026-11-26")).toBe(true);
  });
  it("still works when the storage throws or is missing", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(claimDaily(broken, "quests", "2026-11-25")).toBe(true);
    expect(claimDaily(null, "quests", "2026-11-25")).toBe(false);
  });
  it("formats the local day", () => {
    expect(dayKey(new Date(2026, 10, 5, 23, 59))).toBe("2026-11-05");
  });
});

describe("kudos: one per day and per friend", () => {
  it("blocks a second kudos to the same friend the same day only", () => {
    let ledger = {};
    expect(canSendKudos(ledger, "lea", "2026-11-25")).toBe(true);
    ledger = recordKudos(ledger, "lea", "2026-11-25");
    expect(canSendKudos(ledger, "lea", "2026-11-25")).toBe(false);
    expect(canSendKudos(ledger, "noah", "2026-11-25")).toBe(true);
    expect(canSendKudos(ledger, "lea", "2026-11-26")).toBe(true);
  });
});

describe("quests", () => {
  const q = (current: number, target = 1): Quest => ({
    id: String(current),
    label: "x",
    xp: 10,
    current,
    target,
  });
  it("is done at the target, with a bounded progress", () => {
    expect(questDone(q(1))).toBe(true);
    expect(questDone(q(0))).toBe(false);
    expect(questProgress(q(1, 2))).toBe(0.5);
    expect(questProgress(q(5, 2))).toBe(1);
    expect(questProgress(q(0, 0))).toBe(1);
  });
  it("opens the chest only when the last quest is completed", () => {
    const before = [q(1), q(1), q(0)];
    const after = [q(1), q(1), q(1)];
    expect(chestJustOpened(before, after)).toBe(true);
    expect(chestJustOpened(after, after)).toBe(false);
    expect(chestJustOpened([q(0)], [q(0)])).toBe(false);
    expect(allQuestsDone([])).toBe(false);
  });
});

describe("league", () => {
  const rows: LeagueRow[] = [
    { id: "a", name: "Nour", xp: 2140 },
    { id: "b", name: "Léo", xp: 1980 },
    { id: "me", name: "Inès", xp: 1920, isMe: true },
    { id: "c", name: "Sarah", xp: 1860 },
  ];
  it("ranks by XP, ties by name, from 1", () => {
    const r = rankLeague([...rows, { id: "d", name: "Alix", xp: 1860 }]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(r[3]!.name).toBe("Alix");
    expect(r[4]!.name).toBe("Sarah");
  });
  it("tells how many places a row gained after a gain of XP", () => {
    const before = rankLeague(rows);
    const after = rankLeague(addXp(rows, "me", 100));
    expect(placesGained(before, after, "me")).toBe(1);
    expect(placesGained(before, after, "ghost")).toBe(0);
    expect(addXp(rows, "me", -99999).find((r) => r.id === "me")!.xp).toBe(0);
  });
});

describe("flashcard stack", () => {
  it("removes a known card and sends a card to review to the end", () => {
    expect(nextStack(["a", "b", "c"], "know")).toEqual(["b", "c"]);
    expect(nextStack(["a", "b", "c"], "review")).toEqual(["b", "c", "a"]);
    expect(nextStack([], "know")).toEqual([]);
  });
});

describe("formatClock", () => {
  it("formats mm:ss", () => {
    expect(formatClock(444)).toBe("07:24");
    expect(formatClock(1500)).toBe("25:00");
    expect(formatClock(-5)).toBe("00:00");
  });
});
