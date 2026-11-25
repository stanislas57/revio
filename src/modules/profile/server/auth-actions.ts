"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/routes";
import { credentialsSchema } from "../schemas";

export type AuthFormState = { error?: string; info?: string } | undefined;

function parse(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Generic message: never reveal whether an account exists.
  if (error) return { error: "E-mail ou mot de passe incorrect, ou e-mail non confirmé." };

  redirect(safeNextPath(formData.get("suite")?.toString()));
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: "Inscription impossible pour le moment. Réessaie plus tard." };

  // Email confirmation disabled (local dev): the user is signed in directly.
  if (data.session) redirect("/accueil");
  return {
    info: "Compte créé. Ouvre le lien reçu par e-mail pour confirmer ton adresse, puis connecte-toi.",
  };
}
