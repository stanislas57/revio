import { describe, expect, it } from "vitest";
import { allocateStudyTime, type AllocationInput } from "./time-allocation";

const subs: AllocationInput[] = [
  { id: "a", name: "Maths", coefficient: 3, score: 3, pointValue: 0.5, needsAttention: true },
  { id: "b", name: "Droit", coefficient: 2, score: 1, pointValue: 0.33, needsAttention: true },
  { id: "c", name: "Sport", coefficient: 1, score: 0, pointValue: 0.17, needsAttention: false },
  { id: "d", name: "Option", coefficient: 0, score: 0, pointValue: 0, needsAttention: false },
];
const sum = (r: { minutes: number }[]) => r.reduce((t, x) => t + x.minutes, 0);

describe("allocateStudyTime", () => {
  it("always adds up to the budget, in steps of 5 minutes", () => {
    for (const mode of ["priorities", "balanced", "returns"] as const) {
      for (const budget of [0, 5, 60, 95, 7 * 60 + 25]) {
        const r = allocateStudyTime(subs, budget, mode);
        expect(sum(r)).toBe(Math.floor(budget / 5) * 5);
        expect(r.every((x) => x.minutes % 5 === 0 && x.minutes >= 0)).toBe(true);
      }
    }
  });

  it("priorities: follows the score, nothing for a subject without weight", () => {
    const r = allocateStudyTime(subs, 120, "priorities");
    expect(r.find((x) => x.id === "a")!.minutes).toBe(90);
    expect(r.find((x) => x.id === "b")!.minutes).toBe(30);
    expect(r.find((x) => x.id === "c")!.minutes).toBe(0);
  });

  it("balanced: follows the coefficient, coefficient 0 gets nothing", () => {
    const r = allocateStudyTime(subs, 120, "balanced");
    expect(r.find((x) => x.id === "a")!.minutes).toBe(60);
    expect(r.find((x) => x.id === "b")!.minutes).toBe(40);
    expect(r.find((x) => x.id === "c")!.minutes).toBe(20);
    expect(r.find((x) => x.id === "d")!.minutes).toBe(0);
  });

  it("returns: only subjects below their target", () => {
    const r = allocateStudyTime(subs, 100, "returns");
    expect(r.find((x) => x.id === "c")!.minutes).toBe(0);
    expect(sum(r)).toBe(100);
  });

  it("falls back to the coefficient split when nothing needs attention", () => {
    const done = subs.map((s) => ({ ...s, score: 0, needsAttention: false }));
    expect(sum(allocateStudyTime(done, 60, "priorities"))).toBe(60);
  });

  it("is deterministic and rejects an invalid budget", () => {
    expect(allocateStudyTime(subs, 125, "balanced")).toEqual(allocateStudyTime(subs, 125, "balanced"));
    expect(() => allocateStudyTime(subs, -5, "balanced")).toThrow(RangeError);
    expect(() => allocateStudyTime(subs, Number.NaN, "balanced")).toThrow(RangeError);
  });
});
