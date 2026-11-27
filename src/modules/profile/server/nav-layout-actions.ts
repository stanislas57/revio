"use server";

import { fail, succeed } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import { navLayoutSchema, type NavLayout } from "@/components/layout/nav-layout";

/**
 * Saves the navigation layout (sidebar or top bar) in the caller's private settings. The value is validated with
 * Zod; the database re-checks it (check constraint) and RLS only lets a user write their own row. Only this
 * column is written: the other settings keep their value (or their default when the row is created).
 */
export async function saveNavLayout(input: unknown): Promise<ActionResult<NavLayout>> {
  const parsed = navLayoutSchema.safeParse(input);
  if (!parsed.success) return fail({ code: "validation", message: "Disposition inconnue." });

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, nav_layout: parsed.data }, { onConflict: "user_id" });
  if (error) return fail({ code: "internal", message: "La disposition n'a pas pu être enregistrée." });
  return succeed(parsed.data);
}
