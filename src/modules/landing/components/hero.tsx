import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOOP = ["Planifier", "Réviser", "Gagner de l'XP", "Partager", "Recommencer"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <p className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Version de démonstration, en cours de construction
        </p>
        <h1 id="hero-title" className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Revio : suis tes notes, organise tes révisions et progresse avec tes amis
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-pretty text-muted-foreground">
          Une application pour les étudiants qui veulent comprendre leurs moyennes, réviser plus régulièrement
          et se motiver ensemble.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/connexion">
              Créer mon compte <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <a href="#piliers">Découvrir les fonctionnalités</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Aucun paiement n&apos;est demandé.</p>
      </div>

      <ol
        aria-label="La boucle de Revio"
        className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm"
      >
        {LOOP.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 font-medium">{step}</span>
            {i < LOOP.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />}
          </li>
        ))}
      </ol>
    </section>
  );
}
