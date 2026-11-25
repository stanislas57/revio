import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEnv } from "@/lib/env";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = typeof params.suite === "string" ? params.suite : undefined;
  const configured = getPublicEnv() !== null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <Link href="/" className="text-2xl font-bold tracking-tight">
        Revio
      </Link>
      {configured ? (
        <AuthForm next={next} />
      ) : (
        <p role="alert" className="max-w-sm text-center text-sm text-muted-foreground">
          Supabase n&apos;est pas encore configuré sur cet environnement. Voir README, section « Configurer
          Supabase ». En attendant, la{" "}
          <Link href="/demo" className="underline underline-offset-4">
            démo avec des données d&apos;exemple
          </Link>{" "}
          montre les écrans.
        </p>
      )}
      {params.erreur === "lien" && (
        <p role="alert" className="text-sm text-destructive">
          Lien de confirmation invalide ou expiré.
        </p>
      )}
    </main>
  );
}
