"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { todayIso } from "@/modules/academic/domain/dates";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { addDays } from "@/modules/agenda/domain/dates";
import { expandRange } from "@/modules/agenda/domain/occurrences";
import { idSchema } from "@/modules/agenda/schemas";
import { getAgendaData } from "@/modules/agenda/server/queries";
import { validate } from "@/modules/agenda/server/validate";
import { loadSettings } from "@/modules/profile/server/queries";
import { generatePlan, toMinutes, type PlanSubject } from "../domain/generate";

/** Number of days planned, today included. */
const PLAN_HORIZON_DAYS = 7;

/** Current time of day in the given time zone, minutes since midnight. */
function nowMinutes(timeZone: string, now: Date = new Date()): number {
  const hhmm = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return toMinutes(hhmm);
}

/**
 * (Re)plans the next days: proposes new "recommended" sessions and replaces the previous
 * recommended ones. Accepted and locked sessions, and everything typed by hand, are never touched.
 */
export async function generatePlanAction(): Promise<ActionResult<{ count: number }>> {
  const { supabase, user } = await requireUser();
  const settings = await loadSettings(supabase, user.id);
  const today = todayIso(settings.timezone);
  const last = addDays(today, PLAN_HORIZON_DAYS - 1);

  const [snapshot, agenda] = await Promise.all([getAcademicSnapshot(), getAgendaData(today, last)]);
  const dashboard = buildDashboard(snapshot);

  // Previous proposals are free time for the new plan; they are removed only after the new ones are saved.
  const previous = agenda.events.filter((e) => e.planStatus === "recommended");
  const kept = agenda.events.filter((e) => e.planStatus !== "recommended");
  const byDay = expandRange(kept, agenda.exams, today, last);

  const firstExam = new Map<string, string>();
  for (const exam of agenda.exams) {
    if (exam.subjectId && (!firstExam.has(exam.subjectId) || exam.examOn < firstExam.get(exam.subjectId)!)) {
      firstExam.set(exam.subjectId, exam.examOn);
    }
  }
  const subjects: PlanSubject[] = dashboard.priorities.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    reason: p.reason.slice(0, 400),
    examOn: firstExam.get(p.id) ?? null,
  }));

  const slots = generatePlan({
    days: [...byDay].map(([date, items]) => ({ date, items })),
    subjects,
    nowMinutes: nowMinutes(settings.timezone),
    today,
  });

  if (slots.length > 0) {
    const names = new Map(dashboard.priorities.map((p) => [p.id, p.name]));
    const { error } = await supabase.from("calendar_events").insert(
      slots.map((s) => ({
        subject_id: s.subjectId,
        title: `Réviser ${names.get(s.subjectId) ?? "une matière"}`,
        kind: "study",
        starts_on: s.date,
        last_on: s.date,
        start_time: s.startTime,
        end_time: s.endTime,
        recurrence: "none",
        plan_status: "recommended",
        plan_reason: s.reason,
      })),
    );
    if (error) return fail(toActionError(error));
  }
  if (previous.length > 0) {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .in(
        "id",
        previous.map((e) => e.id),
      );
    if (error) return fail(toActionError(error));
  }
  refresh();
  return succeed({ count: slots.length });
}

const targetStatus = z.enum(["accepted", "locked"], { error: "Statut invalide." });

/**
 * recommended → accepted, accepted → locked, and back (locked → accepted).
 * Only sessions planned by Revio can change status.
 */
export async function setPlanStatus(
  id: string,
  status: "accepted" | "locked",
): Promise<ActionResult<{ id: string }>> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const statusCheck = validate(targetStatus, status);
  if (!statusCheck.ok) return statusCheck.result;
  const { supabase } = await requireUser();
  const current = await supabase.from("calendar_events").select("plan_status").eq("id", id).maybeSingle();
  if (current.error) return fail(toActionError(current.error));
  if (!current.data?.plan_status) {
    return fail({ code: "not_found", message: "Cette séance n'a pas été proposée par Revio." });
  }
  const { error } = await supabase
    .from("calendar_events")
    .update({ plan_status: statusCheck.data })
    .eq("id", id);
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ id });
}
