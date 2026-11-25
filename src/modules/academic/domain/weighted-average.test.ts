import { describe, expect, it } from "vitest";
import { InvalidGradeError, overallAverage, weightedAverage } from "./weighted-average";

describe("weightedAverage", () => {
  it("returns null when there is no grade", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("weights grades by their coefficient", () => {
    // (12×1 + 16×3) / 4 = 15
    expect(weightedAverage([{ value: 12 }, { value: 16, coefficient: 3 }])).toBe(15);
  });

  it("normalises grades to /20", () => {
    // 8/10 → 16, 30/40 → 15 ; mean = 15.5
    expect(
      weightedAverage([
        { value: 8, maxValue: 10 },
        { value: 30, maxValue: 40 },
      ]),
    ).toBeCloseTo(15.5);
  });

  it("rejects invalid grades", () => {
    expect(() => weightedAverage([{ value: 21 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: -1 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: 10, coefficient: 0 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: Number.NaN }])).toThrow(InvalidGradeError);
  });
});

describe("overallAverage", () => {
  it("weights subject averages by subject coefficient and skips empty subjects", () => {
    const result = overallAverage([
      { id: "maths", coefficient: 4, grades: [{ value: 10 }, { value: 14 }] }, // 12
      { id: "anglais", coefficient: 2, grades: [{ value: 18 }] }, // 18
      { id: "histoire", coefficient: 3, grades: [] }, // ignored
    ]);
    // (12×4 + 18×2) / 6 = 14
    expect(result).toBe(14);
  });

  it("returns null when no subject has grades", () => {
    expect(overallAverage([{ id: "x", coefficient: 1, grades: [] }])).toBeNull();
  });
});
