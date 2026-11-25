import { describe, expect, it } from "vitest";
import {
  groupAverages,
  InvalidGradeError,
  normalise,
  overallAverage,
  weightedAverage,
} from "./weighted-average";

describe("weightedAverage", () => {
  it("returns null when there is no grade", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("weights grades by their coefficient", () => {
    // (12×1 + 16×3) / 4 = 15
    expect(weightedAverage([{ value: 12 }, { value: 16, coefficient: 3 }])).toBe(15);
  });

  it("normalises grades with different scales to /20", () => {
    // 8/10 → 16, 30/40 → 15, 4/5 → 16 ; mean = 47/3
    expect(
      weightedAverage([
        { value: 8, maxValue: 10 },
        { value: 30, maxValue: 40 },
        { value: 4, maxValue: 5 },
      ]),
    ).toBeCloseTo(47 / 3);
    expect(normalise({ value: 50, maxValue: 100 })).toBe(10);
  });

  it("accepts the bounds 0 and the maximum", () => {
    expect(weightedAverage([{ value: 0 }, { value: 20 }])).toBe(10);
  });

  it("ignores zero-coefficient grades in the average", () => {
    expect(weightedAverage([{ value: 4, coefficient: 0 }, { value: 14 }])).toBe(14);
  });

  it("returns null when every grade has a zero coefficient", () => {
    expect(weightedAverage([{ value: 15, coefficient: 0 }])).toBeNull();
  });

  it("rejects invalid grades", () => {
    expect(() => weightedAverage([{ value: 21 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: -1 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: 10, coefficient: -1 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: 10, maxValue: 0 }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: Number.NaN }])).toThrow(InvalidGradeError);
    expect(() => weightedAverage([{ value: Number.POSITIVE_INFINITY }])).toThrow(InvalidGradeError);
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

  it("ignores zero-coefficient subjects", () => {
    expect(
      overallAverage([
        { id: "a", coefficient: 0, grades: [{ value: 2 }] },
        { id: "b", coefficient: 1, grades: [{ value: 12 }] },
      ]),
    ).toBe(12);
  });

  it("returns null when no subject has grades", () => {
    expect(overallAverage([{ id: "x", coefficient: 1, grades: [] }])).toBeNull();
    expect(overallAverage([])).toBeNull();
  });

  it("returns null when only zero-coefficient subjects have grades", () => {
    expect(overallAverage([{ id: "x", coefficient: 0, grades: [{ value: 10 }] }])).toBeNull();
  });

  it("rejects a negative subject coefficient", () => {
    expect(() => overallAverage([{ id: "x", coefficient: -2, grades: [] }])).toThrow(InvalidGradeError);
  });
});

describe("groupAverages", () => {
  const subjects = [
    { id: "a", coefficient: 2, ue: "UE 1", grades: [{ value: 10 }] },
    { id: "b", coefficient: 1, ue: "UE 1", grades: [{ value: 16 }] },
    { id: "c", coefficient: 3, ue: "UE 2", grades: [] },
    { id: "d", coefficient: 1, ue: null, grades: [{ value: 8 }] },
    { id: "e", coefficient: 1, ue: "  ", grades: [{ value: 12 }] },
  ];

  it("averages each group by subject coefficient, keeping order", () => {
    const groups = groupAverages(subjects, (s) => s.ue);
    expect(groups.map((g) => g.key)).toEqual(["UE 1", "UE 2", null]);
    expect(groups[0]?.average).toBe(12); // (10×2 + 16) / 3
    expect(groups[0]?.countedCoefficient).toBe(3);
    expect(groups[1]?.average).toBeNull();
    expect(groups[1]?.countedCoefficient).toBe(0);
    expect(groups[2]?.average).toBe(10); // blank label grouped with null
    expect(groups[2]?.subjectIds).toEqual(["d", "e"]);
  });
});
