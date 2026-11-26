import { describe, expect, it } from "vitest";
import { parseAcademicText } from "./document-parser";

const names = (t: string) => parseAcademicText(t).subjects.map((s) => s.name);

describe("parseAcademicText", () => {
  it("reads 'coef' and a grade out of 20 on a line", () => {
    const { subjects } = parseAcademicText("Mathématiques coef 4  14,5 / 20");
    expect(subjects).toEqual([
      {
        name: "Mathématiques",
        coefficient: 4,
        semester: null,
        grades: [{ value: 14.5, maxValue: 20 }],
        notes: [],
      },
    ]);
  });

  it("reads '(coef. 2)' and keeps another scale", () => {
    const [s] = parseAcademicText("Anglais (coef. 2)  8/10").subjects;
    expect(s?.coefficient).toBe(2);
    expect(s?.grades).toEqual([{ value: 8, maxValue: 10 }]);
  });

  it("guesses a coefficient from 'Histoire 3 15' and says so", () => {
    const [s] = parseAcademicText("Histoire-Géographie 3 15").subjects;
    expect(s?.coefficient).toBe(3);
    expect(s?.grades).toEqual([{ value: 15, maxValue: 20 }]);
    expect(s?.notes.join(" ")).toMatch(/deviné/);
  });

  it("keeps only the first number when a bulletin line also shows the class average", () => {
    const [s] = parseAcademicText("Physique-Chimie coef 3 12,5 10,8 17").subjects;
    expect(s?.grades).toEqual([{ value: 12.5, maxValue: 20 }]);
    expect(s?.notes.join(" ")).toMatch(/seul le premier/);
  });

  it("ignores totals, averages, dates, rank and identity lines", () => {
    const text = [
      "Relevé de notes",
      "Nom : DUPONT Léa",
      "Année 2025-2026",
      "Moyenne générale 13,2",
      "Total 55",
      "Rang 3e / 30",
      "Édité le 12/01/2026",
      "Informatique coef 2 16",
    ].join("\n");
    expect(names(text)).toEqual(["Informatique"]);
  });

  it("does not take ECTS or credits for grades or coefficients", () => {
    const [s] = parseAcademicText("Algèbre linéaire  coefficient 3  5 ECTS").subjects;
    expect(s?.coefficient).toBe(3);
    expect(s?.grades).toEqual([]);
  });

  it("drops a grade above its scale", () => {
    const [s] = parseAcademicText("Chimie coef 2 25").subjects;
    expect(s?.coefficient).toBe(2);
    expect(s?.grades).toEqual([]);
  });

  it("tracks the semester heading", () => {
    const { subjects } = parseAcademicText("Semestre 2\nDroit coef 2 11\nTrimestre 3\nEconomie coef 1 9");
    expect(subjects.map((s) => s.semester)).toEqual(["Semestre 2", "Trimestre 3"]);
  });

  it("merges two lines of the same subject", () => {
    const { subjects } = parseAcademicText("Maths coef 4 12\nmaths 15");
    expect(subjects).toHaveLength(1);
    expect(subjects[0]?.grades).toHaveLength(2);
  });

  it("reads a CSV with a header row, in any column order", () => {
    const csv = "Coef;Matière;Note\n3;Philosophie;13,5\n2;Anglais;16";
    const { subjects } = parseAcademicText(csv);
    expect(subjects.map((s) => [s.name, s.coefficient, s.grades[0]?.value])).toEqual([
      ["Philosophie", 3, 13.5],
      ["Anglais", 2, 16],
    ]);
  });

  it("reads a sheet of subjects and coefficients without grades", () => {
    const { subjects } = parseAcademicText("Français coef 4\nMathématiques coef 5\nEPS coef 2");
    expect(subjects.map((s) => [s.name, s.coefficient, s.grades.length])).toEqual([
      ["Français", 4, 0],
      ["Mathématiques", 5, 0],
      ["EPS", 2, 0],
    ]);
  });

  it("warns when nothing can be read", () => {
    const r = parseAcademicText("Lorem ipsum 12/01/2026\n\n---");
    expect(r.subjects).toEqual([]);
    expect(r.warnings[0]).toMatch(/Aucune matière/);
  });

  it("caps the number of subjects and grades", () => {
    const many = Array.from(
      { length: 60 },
      (_, i) =>
        `Matière${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))} coef 1 10`,
    ).join("\n");
    const r = parseAcademicText(many);
    expect(r.subjects.length).toBeLessThanOrEqual(40);
    expect(r.warnings.join(" ")).toMatch(/40/);
  });
});
