import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard";
import type { Grade, Subject } from "./types";

const grade = (subjectId: string, value: number, extra: Partial<Grade> = {}): Grade => ({
  id: `${subjectId}-${value}`,
  subjectId,
  label: null,
  value,
  maxValue: 20,
  coefficient: 1,
  gradedOn: null,
  kind: "other",
  ...extra,
});
const subject = (id: string, extra: Partial<Subject> = {}): Subject => ({
  id,
  name: id,
  coefficient: 1,
  color: null,
  teachingUnit: null,
  semester: "S1",
  targetAverage: null,
  archived: false,
  isTemplate: false,
  grades: [],
  ...extra,
});

describe("buildDashboard", () => {
  const snapshot = {
    today: "2026-11-25",
    targetAverage: 12,
    subjects: [
      subject("compta", { coefficient: 4, grades: [grade("compta", 8)] }),
      subject("anglais", { coefficient: 2, grades: [grade("anglais", 16)] }),
      subject("old", { coefficient: 5, archived: true, grades: [grade("old", 2)] }),
      subject("s2", { semester: "S2", grades: [grade("s2", 14)] }),
    ],
    exams: [
      { id: "e1", subjectId: "anglais", title: "Oral", examOn: "2026-12-01" },
      { id: "e0", subjectId: "compta", title: "Partiel", examOn: "2026-11-27" },
      { id: "past", subjectId: "compta", title: "Ancien", examOn: "2026-11-01" },
      { id: "free", subjectId: null, title: "Concours blanc", examOn: "2026-11-27" },
    ],
  };

  it("ignores archived subjects in averages", () => {
    const d = buildDashboard(snapshot);
    // (8×4 + 16×2 + 14×1) / 7
    expect(d.overall).toBeCloseTo(78 / 7);
    expect(d.activeSubjects.map((s) => s.id)).toEqual(["compta", "anglais", "s2"]);
    expect(d.gradeCount).toBe(3);
    expect(d.gap).toBeCloseTo(78 / 7 - 12);
  });

  it("averages per semester", () => {
    const d = buildDashboard(snapshot);
    expect(d.semesters.map((g) => [g.key, g.average])).toEqual([
      ["S1", 64 / 6],
      ["S2", 14],
    ]);
  });

  it("lists upcoming exams in date order, past ones excluded", () => {
    const d = buildDashboard(snapshot);
    expect(d.upcomingExams.map((e) => [e.id, e.inDays, e.subjectName])).toEqual([
      ["free", 2, null],
      ["e0", 2, "compta"],
      ["e1", 6, "anglais"],
    ]);
  });

  it("ranks priorities with the next exam taken into account", () => {
    const d = buildDashboard(snapshot);
    expect(d.priorities[0]?.id).toBe("compta");
    expect(d.priorities[0]?.reason).toContain("Examen dans 2 jours.");
  });

  it("handles an empty account", () => {
    const d = buildDashboard({ today: "2026-11-25", targetAverage: null, subjects: [], exams: [] });
    expect(d).toMatchObject({ overall: null, gap: null, gradeCount: 0, priorities: [], upcomingExams: [] });
  });
});
