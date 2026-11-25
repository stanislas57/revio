import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { hypothesisSchema } from "../schemas";
import type { Hypothesis } from "../domain/scenario";

export type SavedScenario = { id: string; name: string; hypotheses: Hypothesis[]; createdAt: string };

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  hypotheses: z.array(z.unknown()),
  created_at: z.string(),
});

/** The caller's saved scenarios, newest first (owner-only RLS). Unreadable hypotheses are dropped. */
export async function listScenarios(): Promise<SavedScenario[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("simulation_scenarios")
    .select("id, name, hypotheses, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Impossible de charger tes scénarios.");
  return rowSchema
    .array()
    .parse(data ?? [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
      hypotheses: r.hypotheses.flatMap((h) => {
        const parsed = hypothesisSchema.safeParse(h);
        return parsed.success ? [parsed.data] : [];
      }),
    }))
    .filter((s) => s.hypotheses.length > 0);
}
