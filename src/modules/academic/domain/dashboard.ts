/** Builds the dashboard view model from raw data. Pure and deterministic. */

import { daysBetween } from "./dates";
import { computePriorities, type Priority } from "./priority";
import type { AcademicSnapshot, Exam, Subject } from "./types";
import { groupAverages, overallAverage, weightedAverage, type GroupAverage } from "./weighted-average";

export type UpcomingExam = Exam & { inDays: number; subjectName: string | null };

export type Dashboard = {
  activeSubjects: Subject[];
  overall: number | null;
  target: number | null;
  /** overall − target, null when either is unknown. */
  gap: number | null;
  gradeCount: number;
  semesters: GroupAverage[];
  priorities: Priority[];
  upcomingExams: UpcomingExam[];
};

export function subjectAverage(subject: Subject): number | null {
  return weightedAverage(subject.grades);
}

export function buildDashboard({ subjects, exams, targetAverage, today }: AcademicSnapshot): Dashboard {
  const activeSubjects = subjects.filter((s) => !s.archived);
  const overall = overallAverage(activeSubjects);
  const byId = new Map(subjects.map((s) => [s.id, s]));

  const upcomingExams = exams
    .map((exam) => ({
      ...exam,
      inDays: daysBetween(today, exam.examOn),
      subjectName: exam.subjectId ? (byId.get(exam.subjectId)?.name ?? null) : null,
    }))
    .filter((exam) => exam.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays || a.title.localeCompare(b.title, "fr"));

  const nextExam = new Map<string, number>();
  for (const exam of upcomingExams) {
    if (exam.subjectId && !nextExam.has(exam.subjectId)) nextExam.set(exam.subjectId, exam.inDays);
  }

  const priorities = computePriorities(
    activeSubjects.map((s) => ({
      id: s.id,
      name: s.name,
      coefficient: s.coefficient,
      average: subjectAverage(s),
      target: s.targetAverage,
      nextExamInDays: nextExam.get(s.id) ?? null,
    })),
    targetAverage,
  );

  return {
    activeSubjects,
    overall,
    target: targetAverage,
    gap: overall !== null && targetAverage !== null ? overall - targetAverage : null,
    gradeCount: activeSubjects.reduce((n, s) => n + s.grades.length, 0),
    semesters: groupAverages(activeSubjects, (s) => s.semester),
    priorities,
    upcomingExams,
  };
}
