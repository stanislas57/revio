import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="border-t py-16 sm:py-24">
      <div className="mx-auto max-w-2xl space-y-4 px-4 text-center">
        <h2 id="cta-title" className="landing-serif text-4xl sm:text-5xl">
          Prêt à <em className="text-brand-text">essayer ?</em>
        </h2>
        <p className="text-muted-foreground">
          Crée un compte avec ton adresse e-mail. Aucun paiement n&apos;est demandé.
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/connexion">Créer mon compte</Link>
        </Button>
      </div>
    </section>
  );
}
