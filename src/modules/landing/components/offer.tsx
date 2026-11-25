import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

const FREE = [
  "Matières, coefficients et notes",
  "Moyennes et simulation de base",
  "Séances Focus avec chronomètre",
  "Amis, fil d'activité et bravos",
  "XP, niveaux et série",
];

const PREMIUM = [
  "Planning de révision avancé",
  "Replanification automatique",
  "Simulations avancées",
  "Statistiques approfondies",
];

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Offer() {
  return (
    <section id="offre" aria-labelledby="offre-title" className="scroll-mt-16 border-t py-16 sm:py-24">
      <Reveal className="mx-auto max-w-4xl px-4">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="offre-title" className="landing-serif text-4xl sm:text-5xl">
            Gratuit <em className="text-brand-text">pour commencer</em>
          </h2>
          <p className="text-muted-foreground">
            L&apos;essentiel est pensé pour être gratuit. Une offre Premium est envisagée plus tard.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <article className="space-y-4 rounded-2xl border bg-card p-6 shadow-[0_18px_50px_-30px_rgb(20_20_20/0.3)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Gratuit</h3>
              <Badge variant="secondary">Pendant la démonstration</Badge>
            </div>
            <List items={FREE} />
          </article>
          <article className="space-y-4 rounded-2xl border border-dashed bg-card p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Premium</h3>
              <Badge variant="outline">Envisagé</Badge>
            </div>
            <List items={PREMIUM} />
          </article>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Le contenu et les tarifs du Premium ne sont pas fixés. Rien n&apos;est à payer aujourd&apos;hui.
        </p>
      </Reveal>
    </section>
  );
}
