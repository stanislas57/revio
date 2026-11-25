import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewBanner } from "@/modules/preview/shared";

export const metadata: Metadata = {
  title: "Aperçu du nouveau design",
  robots: { index: false, follow: false },
};

const SCREENS = [
  {
    href: "/apercu/accueil",
    title: "Accueil de révision",
    text: "Présence, révision du jour, quêtes, fil, série, binôme, ligue.",
  },
  { href: "/apercu/fil", title: "Fil", text: "Onglets Amis, Ma classe et Groupes, fiches partagées, kudos." },
  { href: "/apercu/fiches", title: "Mes fiches", text: "Recherche, matières, pile de cartes à réviser." },
  { href: "/apercu/progression", title: "Progression", text: "Niveau, semaine, série, badges, ligue." },
  { href: "/apercu/focus", title: "Focus à deux", text: "Minuteur sur fond sombre et binôme." },
];

/** Index of the mock-up screens of the new design (features that do not exist in the product yet). */
export default function ApercuPage() {
  return (
    <>
      <PageHeader
        title="Aperçu du nouveau design"
        description="Des écrans de démonstration, pour voir où va Revio."
      />
      <PreviewBanner>Ces écrans ne sont reliés à aucune donnée réelle.</PreviewBanner>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SCREENS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex min-h-11 items-center gap-3 rounded-lg border bg-card p-4 transition-colors outline-none hover:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-heading font-semibold">{s.title}</span>
                <span className="block text-sm text-muted-foreground">{s.text}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
