import { describe, expect, it } from "vitest";
import { projectScenario } from "./scenario";
import type { SubjectInput } from "./weighted-average";

const subjects: SubjectInput[] = [
  { id: "maths", coefficient: 2, grades: [{ value: 10, maxValue: 20, coefficient: 1 }] },
  { id: "histoire", coefficient: 1, grades: [{ value: 14, maxValue: 20, coefficient: 1 }] },
];

describe("projectScenario", () => {
  it("leaves averages unchanged with no applicable hypothesis", () => {
    const p = projectScenario(subjects, []);
    expect(p.overallAfter).toBeCloseTo(p.overallBefore ?? 0);
    expect(p.subjects).toEqual([]);
  });

  it("adds several hypothetical grades to several subjects", () => {
    const p = projectScenario(subjects, [
      { subjectId: "maths", value: 18, maxValue: 20, coefficient: 1 },
      { subjectId: "histoire", value: 8, maxValue: 10, coefficient: 1 },
    ]);
    expect(p.overallBefore).toBeCloseTo((10 * 2 + 14) / 3);
    // maths -> (10+18)/2 = 14 ; histoire -> (14+16)/2 = 15
    expect(p.subjects.find((s) => s.subjectId === "maths")?.after).toBeCloseTo(14);
    expect(p.subjects.find((s) => s.subjectId === "histoire")?.after).toBeCloseTo(15);
    expect(p.overallAfter).toBeCloseTo((14 * 2 + 15) / 3);
  });

  it("ignores hypotheses on unknown subjects and says how many", () => {
    const p = projectScenario(subjects, [{ subjectId: "gone", value: 20, maxValue: 20, coefficient: 1 }]);
    expect(p.ignored).toBe(1);
    expect(p.overallAfter).toBeCloseTo(p.overallBefore ?? 0);
  });

  it("rejects an out-of-range grade and too many hypotheses", () => {
    expect(() =>
      projectScenario(subjects, [{ subjectId: "maths", value: 25, maxValue: 20, coefficient: 1 }]),
    ).toThrow();
    const many = Array.from({ length: 21 }, () => ({
      subjectId: "maths",
      value: 10,
      maxValue: 20,
      coefficient: 1,
    }));
    expect(() => projectScenario(subjects, many)).toThrow(RangeError);
  });

  it("does not mutate its inputs", () => {
    const copy = JSON.stringify(subjects);
    projectScenario(subjects, [{ subjectId: "maths", value: 20, maxValue: 20, coefficient: 1 }]);
    expect(JSON.stringify(subjects)).toBe(copy);
  });
});
