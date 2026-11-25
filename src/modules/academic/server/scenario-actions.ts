"use server";

import { refresh } from "next/cache";
import { fail, succeed, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { idSchema, scenarioSchema, type ScenarioInput } from "../schemas";
import { validate } from "./validate";

/** Saves a named list of hypothetical grades. Private to the caller; 20 scenarios at most. */
export async function saveScenario(input: ScenarioInput): Promise<ActionResult<{ id: string }>> {
  const v = validate(scenarioSchema, input);
  if (!v.ok) return v.result;
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("simulation_scenarios")
    .insert({ name: v.data.name, hypotheses: v.data.hypotheses })
    .select("id")
    .single();
  if (error) {
    return fail(toActionError(error, { "54000": "Tu as déjà 20 scénarios : supprime-en un d'abord." }));
  }
  refresh();
  return succeed({ id: String(data.id) });
}

export async function deleteScenario(id: string): Promise<ActionResult<{ id: string }>> {
  const idCheck = validate(idSchema, id);
  if (!idCheck.ok) return idCheck.result;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("simulation_scenarios").delete().eq("id", id);
  if (error) return fail(toActionError(error));
  refresh();
  return succeed({ id });
}
