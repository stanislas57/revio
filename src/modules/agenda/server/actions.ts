"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { eventSchema, idSchema } from "../schemas";
import type { EventInput } from "../schemas";
import { validate } from "./validate";

type Done = ActionResult<{ id: string }>;

function columns(d: ReturnType<typeof eventSchema.parse>) {
  const repeats = d.recurrence !== "none";
  return {
    subject_id: d.subjectId,
    title: d.title,
    kind: d.kind,
    starts_on: d.startsOn,
    last_on: repeats && d.repeatUntil ? d.repeatUntil : d.startsOn,
    start_time: d.startTime,
    end_time: d.endTime,
    recurrence: d.recurrence,
  };
}

export async function addEvent(input: EventInput): Promise<Done> {
  const v = validate(eventSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(columns(v.data))
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ id: String(data.id) });
}

/** Edits the whole series (there is no per-occurrence exception yet). */
export async function updateEvent(id: string, input: EventInput): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const v = validate(eventSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("calendar_events")
    .update(columns(v.data))
    .eq("id", id)
    .select("id")
    .single();
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ id: String(data.id) });
}

/** Deletes the event, and with it every occurrence of its series. */
export async function deleteEvent(id: string): Promise<Done> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ id });
}
