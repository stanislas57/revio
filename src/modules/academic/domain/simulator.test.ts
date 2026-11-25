import { describe, expect, it } from "vitest";
import { projectAverage, requiredGrade } from "./simulator";
import type { SubjectInput } from "./weighted-average";

const subjects: SubjectInput[] = [
  { id: "maths", coefficient: 4, grades: [{ value: 10 }] },
  { id: "anglais", coefficient: 2, grades: [{ value: 16 }] },
  { id: "droit", coefficient: 2, grades: [] },
  { id: "option", coefficient: 0, grades: [{ value: 12 }] },
];

describe("projectAverage", () => {
  it("projects the subject average with a new grade", () => {
    // maths: (10 + 14) / 2 = 12
    expect(
      projectAverage(subjects, { subjectId: "maths", coefficient: 1, maxValue: 20 }, 14, "subject"),
    ).toBe(12);
  });

  it("projects the overall average with a new grade", () => {
    // maths 12 ×4, anglais 16 ×2 → 80/6
    expect(
      projectAverage(subjects, { subjectId: "maths", coefficient: 1, maxValue: 20 }, 14, "overall"),
    ).toBeCloseTo(80 / 6);
  });

  it("includes a subject that had no grade yet", () => {
    // maths 10×4 + anglais 16×2 + droit 7×2 = 86 / 8
    expect(
      projectAverage(subjects, { subjectId: "droit", coefficient: 1, maxValue: 20 }, 7, "overall"),
    ).toBeCloseTo(86 / 8);
  });

  it("handles a different scale", () => {
    // 5/10 = 10/20 → maths stays 10
    expect(projectAverage(subjects, { subjectId: "maths", coefficient: 1, maxValue: 10 }, 5, "subject")).toBe(
      10,
    );
  });

  it("rejects an unknown subject", () => {
    expect(() =>
      projectAverage(subjects, { subjectId: "nope", coefficient: 1, maxValue: 20 }, 5, "subject"),
    ).toThrow(RangeError);
  });
});

describe("requiredGrade", () => {
  it("finds the grade needed for a subject target", () => {
    // maths (10 + 3g) / 4 ≥ 13 → g ≥ 14
    const r = requiredGrade(subjects, { subjectId: "maths", coefficient: 3, maxValue: 20 }, 13, "subject");
    expect(r).toMatchObject({ status: "reachable", requiredValue: 14 });
  });

  it("finds the grade needed for an overall target and rounds up", () => {
    // overall = (4 × (10+g)/2 + 32) / 6 ≥ 13 → 2g + 52 ≥ 78 → g ≥ 13
    const r = requiredGrade(subjects, { subjectId: "maths", coefficient: 1, maxValue: 20 }, 13, "overall");
    expect(r.status).toBe("reachable");
    if (r.status === "reachable") {
      expect(r.requiredValue).toBe(13);
      expect(r.worst).toBeCloseTo(52 / 6);
      expect(r.best).toBeCloseTo(92 / 6);
    }
    // target 12.9: g ≥ 12.7 exactly
    const r2 = requiredGrade(subjects, { subjectId: "maths", coefficient: 1, maxValue: 20 }, 12.9, "overall");
    expect(r2).toMatchObject({ status: "reachable", requiredValue: 12.7 });
    // target 12.95 → 12.85 ; target 12.951 → 12.853 → rounded up to 12.86
    const r3 = requiredGrade(
      subjects,
      { subjectId: "maths", coefficient: 1, maxValue: 20 },
      12.951,
      "overall",
    );
    expect(r3).toMatchObject({ status: "reachable", requiredValue: 12.86 });
  });

  it("expresses the required grade on the grade's own scale", () => {
    // subject target 13 with coef 3 needs 14/20 → 7/10
    const r = requiredGrade(subjects, { subjectId: "maths", coefficient: 3, maxValue: 10 }, 13, "subject");
    expect(r).toMatchObject({ status: "reachable", requiredValue: 7 });
  });

  it("flags a mathematically impossible target", () => {
    // best case maths (10+20)/2 = 15 → overall (60+32)/6 = 15.33 < 18
    const r = requiredGrade(subjects, { subjectId: "maths", coefficient: 1, maxValue: 20 }, 18, "overall");
    expect(r.status).toBe("impossible");
    if (r.status === "impossible") expect(r.best).toBeCloseTo(92 / 6);
  });

  it("says when the target is reached whatever the grade", () => {
    const r = requiredGrade(subjects, { subjectId: "anglais", coefficient: 1, maxValue: 20 }, 8, "subject");
    expect(r).toMatchObject({ status: "guaranteed", worst: 8, best: 18 });
  });

  it("reports no effect for a zero-coefficient grade or subject", () => {
    expect(
      requiredGrade(subjects, { subjectId: "maths", coefficient: 0, maxValue: 20 }, 12, "subject"),
    ).toEqual({ status: "no_effect", current: 10 });
    expect(
      requiredGrade(subjects, { subjectId: "option", coefficient: 1, maxValue: 20 }, 12, "overall"),
    ).toMatchObject({ status: "no_effect" });
  });

  it("handles a subject with no grade at all", () => {
    const r = requiredGrade(subjects, { subjectId: "droit", coefficient: 1, maxValue: 20 }, 11, "subject");
    expect(r).toMatchObject({ status: "reachable", requiredValue: 11 });
  });

  it("rejects an invalid target or hypothesis", () => {
    const h = { subjectId: "maths", coefficient: 1, maxValue: 20 };
    expect(() => requiredGrade(subjects, h, 25, "overall")).toThrow(RangeError);
    expect(() => requiredGrade(subjects, { ...h, maxValue: 0 }, 10, "overall")).toThrow(RangeError);
    expect(() => requiredGrade(subjects, { ...h, coefficient: -1 }, 10, "overall")).toThrow(RangeError);
  });
});
