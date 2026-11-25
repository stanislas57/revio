import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Revio</h1>
      <p className="text-lg text-muted-foreground">
        Suis tes notes, organise tes révisions et progresse avec tes amis.
      </p>
      <Button asChild size="lg">
        <Link href="/connexion">Se connecter ou créer un compte</Link>
      </Button>
      <p className="text-xs text-muted-foreground">Version de démonstration, en cours de construction.</p>
    </main>
  );
}
