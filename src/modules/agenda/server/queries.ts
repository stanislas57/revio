import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { EVENT_KINDS, RECURRENCES, type CalendarEvent, type ExamItem } from "../domain/types";

const eventRow = z.object({
  id: z.string(),
  subject_id: z.string().nullable(),
  title: z.string(),
  kind: z.enum(EVENT_KINDS),
  starts_on: z.string(),
  last_on: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  recurrence: z.enum(RECURRENCES),
});
const examRow = z.object({
  id: z.string(),
  subject_id: z.string().nullable(),
  title: z.string(),
  exam_on: z.string(),
});
const subjectRow = z.object({ id: z.string(), name: z.string() });

export type AgendaData = {
  events: CalendarEvent[];
  exams: ExamItem[];
  subjects: { id: string; name: string }[];
};

/** Events overlapping [from, to], exams in the same range and the active subjects (RLS: owner only). */
export async function getAgendaData(from: string, to: string): Promise<AgendaData> {
  const { supabase } = await requireUser();
  const [events, exams, subjects] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, subject_id, title, kind, starts_on, last_on, start_time, end_time, recurrence")
      .lte("starts_on", to)
      .gte("last_on", from)
      .order("starts_on", { ascending: true }),
    supabase
      .from("exams")
      .select("id, subject_id, title, exam_on")
      .gte("exam_on", from)
      .lte("exam_on", to)
      .order("exam_on", { ascending: true }),
    supabase.from("subjects").select("id, name").is("archived_at", null).order("name", { ascending: true }),
  ]);
  if (events.error || exams.error || subjects.error) {
    throw new Error("Impossible de charger ton agenda.");
  }
  return {
    events: z
      .array(eventRow)
      .parse(events.data ?? [])
      .map((r): CalendarEvent => ({
        id: r.id,
        subjectId: r.subject_id,
        title: r.title,
        kind: r.kind,
        startsOn: r.starts_on,
        lastOn: r.last_on,
        startTime: r.start_time,
        endTime: r.end_time,
        recurrence: r.recurrence,
      })),
    exams: z
      .array(examRow)
      .parse(exams.data ?? [])
      .map((r): ExamItem => ({ id: r.id, subjectId: r.subject_id, title: r.title, examOn: r.exam_on })),
    subjects: z.array(subjectRow).parse(subjects.data ?? []),
  };
}
