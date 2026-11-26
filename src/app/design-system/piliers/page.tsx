import type { Metadata } from "next";
import { MockBadge } from "@/components/states/not-implemented";
import { PillarsA } from "@/modules/landing/components/pillars-a";
import { PillarsB } from "@/modules/landing/components/pillars-b";
import { PillarsC } from "@/modules/landing/components/pillars-c";
import "@/modules/landing/landing.css";

export const metadata: Metadata = {
  title: "Piliers : trois variantes",
  description: "Page temporaire : trois propositions pour la section « Quatre idées » de la landing.",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  {
    id: "variante-a",
    name: "Variante A · Le jeu de cartes",
    idea: "Une carte par pilier, à retourner pour essayer un mini-aperçu interactif.",
    Section: PillarsA,
  },
  {
    id: "variante-b",
    name: "Variante B · Une journée avec Revio",
    idea: "Les quatre piliers racontés comme quatre moments d'une journée, au défilement.",
    Section: PillarsB,
  },
  {
    id: "variante-c",
    name: "Variante C · La grille vivante",
    idea: "Une grille « bento » où chaque case réagit : XP qui monte, série qui s'allume, amis en révision.",
    Section: PillarsC,
  },
] as const;

/**
 * TEMPORARY page to choose the new layout of the landing's pillars. Public but not indexed and not linked.
 * To be deleted once a variant is chosen (it then replaces `pillars.tsx`).
 */
export default function PillarsVariantsPage() {
  return (
    <div className="landing-root min-h-dvh">
      <header className="mx-auto max-w-6xl space-y-3 px-4 pt-10">
        <h1 className="font-heading text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Piliers : trois variantes
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <MockBadge /> Page temporaire, non indexée : elle disparaît dès qu&apos;une variante est choisie. La
          landing n&apos;a pas changé.
        </p>
        <nav aria-label="Variantes">
          <ul className="flex flex-wrap gap-2">
            {VARIANTS.map((v) => (
              <li key={v.id}>
                <a
                  href={`#${v.id}`}
                  className="inline-flex min-h-11 items-center rounded-md border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {v.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        {VARIANTS.map(({ id, name, idea, Section }) => (
          <div key={id} id={id} className="scroll-mt-4 pt-14">
            <div className="mx-auto max-w-6xl px-4">
              <p className="inline-flex rounded-pill bg-revio-midnight px-4 py-1.5 text-sm font-bold text-white">
                {name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{idea}</p>
            </div>
            <Section id={`piliers-${id.slice(-1)}`} />
          </div>
        ))}
      </main>
    </div>
  );
}
