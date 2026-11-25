import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitStage } from "./orbit-stage";

const LOOP = ["Planifie", "Révise", "Gagne de l'XP", "Recommence"];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto max-w-[90rem] overflow-x-clip px-4 pt-12 pb-10 sm:pt-16"
    >
      <OrbitStage>
        <div className="orbit-text mx-auto max-w-2xl space-y-6 text-center">
          <p className="inline-flex items-center rounded-pill bg-brand-soft px-3 py-1 text-xs font-bold tracking-wide text-brand-soft-foreground uppercase">
            La nouvelle façon de réviser
          </p>
          {/* Title of the charter (bêta 01, page 1). Not an official slogan until the founders validate it. */}
          <h1
            id="hero-title"
            className="landing-display text-[2.625rem] leading-[0.98] text-balance sm:text-[4rem] lg:text-[5.5rem]"
          >
            Moins de stress.
            <br />
            <em className="text-brand-text">Plus de progrès.</em>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-pretty text-muted-foreground lg:max-w-md">
            Organise tes révisions, gagne de l&apos;XP et progresse avec tes amis.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
              <Link href="/connexion">
                Rejoindre la bêta <ArrowUpRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11 w-full bg-card sm:w-auto">
              <Link href="/demo">Explorer la démo</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Version de démonstration, en cours de construction. Aucun paiement n&apos;est demandé.
          </p>
        </div>
      </OrbitStage>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Les cartes ci-dessus sont des exemples avec des données inventées : touche-en une pour voir
        l&apos;idée.
      </p>

      <ol
        aria-label="La boucle de Revio"
        className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 border-y py-4 text-sm font-extrabold tracking-wide uppercase"
      >
        {LOOP.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span>{step}</span>
            {i < LOOP.length - 1 && (
              <span aria-hidden className="text-revio-primary dark:text-revio-lime">
                ✦
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
