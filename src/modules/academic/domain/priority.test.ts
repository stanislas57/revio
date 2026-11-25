import { describe, expect, it } from "vitest";
import { computePriorities, type PriorityInput } from "./priority";

const base: PriorityInput = {
  id: "x",
  name: "X",
  coefficient: 1,
  average: 12,
  target: null,
  nextExamInDays: null,
};

describe("computePriorities", () => {
  it("ranks by missing overall points (gap × coefficient share)", () => {
    const result = computePriorities(
      [
        { ...base, id: "compta", name: "Comptabilité", coefficient: 4, average: 9 }, // gap 3 × 0.5
        { ...base, id: "anglais", name: "Anglais", coefficient: 2, average: 8 }, // gap 4 × 0.25
        { ...base, id: "droit", name: "Droit", coefficient: 2, average: 13 }, // reached
      ],
      12,
    );
    expect(result.map((p) => p.id)).toEqual(["compta", "anglais", "droit"]);
    expect(result[0]?.score).toBeCloseTo(1.5);
    expect(result[1]?.score).toBeCloseTo(1);
    expect(result[2]).toMatchObject({ score: 0, needsAttention: false });
    expect(result[0]?.reason).toBe(
      "Moyenne 9,00 pour un objectif de 12,00 : il manque 3,00 points. Coefficient 4 (50 % de ta moyenne) : chaque point gagné ici rapporte 0,50 point à ta moyenne générale.",
    );
    expect(result[2]?.reason).toContain("Objectif atteint");
  });

  it("uses the subject target first, then the overall target, then 10", () => {
    const [withOwn] = computePriorities([{ ...base, average: 11, target: 14 }], 12);
    expect(withOwn?.score).toBeCloseTo(3);
    const [withOverall] = computePriorities([{ ...base, average: 11 }], 12);
    expect(withOverall?.score).toBeCloseTo(1);
    const [withDefault] = computePriorities([{ ...base, average: 9 }], null);
    expect(withDefault?.score).toBeCloseTo(1);
  });

  it("boosts subjects with an exam within 14 days", () => {
    const [today] = computePriorities([{ ...base, average: 11, nextExamInDays: 0 }], 12);
    expect(today?.score).toBeCloseTo(2);
    expect(today?.reason).toContain("Examen aujourd'hui.");
    const [week] = computePriorities([{ ...base, average: 11, nextExamInDays: 7 }], 12);
    expect(week?.score).toBeCloseTo(1.5);
    const [tomorrow] = computePriorities([{ ...base, average: 11, nextExamInDays: 1 }], 12);
    expect(tomorrow?.reason).toContain("Examen demain.");
    const [far] = computePriorities([{ ...base, average: 11, nextExamInDays: 30 }], 12);
    expect(far?.score).toBeCloseTo(1);
    expect(far?.reason).not.toContain("Examen");
  });

  it("treats a subject without grades as one missing point", () => {
    const [p] = computePriorities([{ ...base, average: null }], 12);
    expect(p?.score).toBeCloseTo(1);
    expect(p?.reason).toContain("Aucune note encore");
  });

  it("never prioritises zero-coefficient subjects", () => {
    const result = computePriorities(
      [
        { ...base, id: "opt", coefficient: 0, average: 2 },
        { ...base, id: "main", coefficient: 1, average: 15 },
      ],
      12,
    );
    expect(result.find((p) => p.id === "opt")).toMatchObject({ score: 0, needsAttention: false });
    expect(result.find((p) => p.id === "main")?.pointValue).toBe(1);
  });

  it("is deterministic on ties (point value, then name)", () => {
    const result = computePriorities(
      [
        { ...base, id: "b", name: "B", average: 15 },
        { ...base, id: "a", name: "A", average: 15 },
      ],
      12,
    );
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("returns an empty list without subjects", () => {
    expect(computePriorities([], 12)).toEqual([]);
  });
});
