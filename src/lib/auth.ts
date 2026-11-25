import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "@/lib/routes";

/**
 * Returns the signed-in user or redirects to the login page.
 * Always call this in protected pages/actions: the proxy alone is not a
 * security boundary, RLS in the database is the final one.
 */
export async function requireUser() {
  await connection(); // per-request, never prerendered
  if (!getPublicEnv()) redirect(`${LOGIN_PATH}?erreur=config`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(LOGIN_PATH);
  return { supabase, user: data.user };
}
