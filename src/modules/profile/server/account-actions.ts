"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, toActionError } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { isDeleteConfirmed } from "../domain/account-export";

const deleteSchema = z.object({
  confirmation: z.string().refine(isDeleteConfirmed, { error: "Tape SUPPRIMER pour confirmer." }),
});

/**
 * Permanently deletes the caller's account and all their data (SQL function `delete_my_account`,
 * which cascades). Irreversible: the UI asks the user to type SUPPRIMER, checked again here.
 * On success the user is signed out and sent to the login page.
 */
export async function deleteMyAccount(input: { confirmation: string }): Promise<ActionResult<never>> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return fail({
      code: "validation",
      message: parsed.error.issues[0]?.message ?? "Confirmation invalide.",
      fields: { confirmation: "Tape SUPPRIMER pour confirmer." },
    });
  }
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return fail(toActionError(error));
  // The account is gone: clear the local session (the call may fail, which does not matter).
  await supabase.auth.signOut().catch(() => undefined);
  redirect("/connexion?compte=supprime");
}
