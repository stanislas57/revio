import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { StudyStats } from "../contracts";

const statsSchema = z.object({
  todayMinutes: z.number().int(),
  weekMinutes: z.number().int(),
  monthMinutes: z.number().int(),
  totalMinutes: z.number().int(),
  sessionsCount: z.number().int(),
  averageSessionMinutes: z.number().int(),
  bySubject: z.array(
    z.object({
      subjectId: z.string().nullable(),
      name: z.string(),
      color: z.string().nullable(),
      minutes: z.number().int(),
    }),
  ),
  daily: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      minutes: z.number().int(),
      xp: z.number().int(),
    }),
  ),
});

/** The caller's study statistics over the last 30 days: ONE database call (`my_study_stats`). */
export async function getStudyStats(): Promise<StudyStats> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("my_study_stats", { p_days: 30 });
  if (error) throw new Error("Impossible de charger tes statistiques.");
  return statsSchema.parse(data);
}
