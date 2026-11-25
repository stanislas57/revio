"use client";

// Inspiration : shadcn/ui — Card (MIT) · implémentation originale pour Revio
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SharedSheet = {
  id: string;
  title: string;
  /** "Maths · Terminale · 18 cartes · 9 min" */
  meta: string;
  author: string;
  initials: string;
  /** "il y a 2 h" */
  sharedAgo: string;
  xp: number;
  reviewedBy: number;
  href: string;
};

/** A shared sheet shown as a post: author, +XP badge (lime under midnight text), preview, "Réviser". */
export function SharedSheetCard({ sheet, className }: { sheet: SharedSheet; className?: string }) {
  return (
    <article
      aria-label={`Fiche partagée : ${sheet.title}`}
      className={cn("space-y-3 rounded-lg border bg-card p-4", className)}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-revio-primary text-sm font-bold text-white"
        >
          {sheet.initials}
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold">{sheet.author}</span>
          <span className="block text-xs text-muted-foreground">a partagé une fiche · {sheet.sharedAgo}</span>
        </p>
        <span className="rounded-pill bg-revio-lime px-2.5 py-1 text-xs font-bold text-revio-midnight">
          +{sheet.xp} XP
        </span>
      </header>
      <div className="rounded-md bg-muted px-4 py-5">
        <h3 className="font-heading text-xl font-bold">{sheet.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{sheet.meta}</p>
      </div>
      <footer className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Révisée par {sheet.reviewedBy} ami{sheet.reviewedBy > 1 ? "s" : ""}
        </p>
        <Button asChild className="min-h-11 px-5">
          <Link href={sheet.href}>
            Réviser<span className="sr-only"> : {sheet.title}</span>
          </Link>
        </Button>
      </footer>
    </article>
  );
}
