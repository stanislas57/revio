import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#piliers", label: "Fonctionnalités" },
  { href: "#apercu", label: "Aperçu" },
  { href: "#offre", label: "Offre" },
  { href: "#faq", label: "FAQ" },
];

const focusRing = "rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-[var(--landing-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className={`landing-serif -mx-1 inline-flex min-h-11 items-center px-1 text-2xl ${focusRing}`}
        >
          Revio
        </Link>
        <nav aria-label="Sections de la page" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm text-muted-foreground hover:text-foreground ${focusRing}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/connexion">Créer un compte</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
