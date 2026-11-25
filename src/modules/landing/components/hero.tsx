import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitStage } from "./orbit-stage";

const LOOP = ["Planifier", "Réviser", "Gagner de l'XP", "Partager", "Recommencer"];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto max-w-[90rem] overflow-x-clip px-4 pt-12 pb-10 sm:pt-16"
    >
      <OrbitStage>
        <div className="orbit-text mx-auto max-w-2xl space-y-6 text-center">
          <p className="inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-xs text-muted-foreground">
            Version de démonstration, en cours de construction
          </p>
          {/* TITRE PROVISOIRE : à valider avant toute mise en ligne (aucun slogan officiel). */}
          <h1
            id="hero-title"
            className="landing-display text-5xl leading-[1.05] text-balance sm:text-6xl lg:text-7xl"
          >
            Révise mieux,
            <br />
            <em className="text-brand-text">ensemble.</em>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-pretty text-muted-foreground lg:max-w-md">
            Suis tes notes, organise tes révisions et progresse avec tes amis : une application pensée pour
            les étudiants.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
              <Link href="/connexion">
                Créer mon compte <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-11 w-full bg-transparent hover:bg-card sm:w-auto"
            >
              <Link href="/connexion">Se connecter</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Aucun paiement n&apos;est demandé.</p>
        </div>
      </OrbitStage>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Les cartes ci-dessus sont des exemples avec des données inventées : touche-en une pour voir
        l&apos;idée.
      </p>

      <ol
        aria-label="La boucle de Revio"
        className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm"
      >
        {LOOP.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-full border bg-card px-3 py-1 font-medium">{step}</span>
            {i < LOOP.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />}
          </li>
        ))}
      </ol>
    </section>
  );
}
