"use client";

import { useId, useState } from "react";
import { Search } from "lucide-react";
import { FlashcardStack } from "@/components/revio/flashcard-stack";
import { SharedSheetCard } from "@/components/revio/shared-sheet-card";
import { RevioSubjectCard } from "@/components/revio/subject-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DEMO_CARDS, DEMO_SHEET, DEMO_SUBJECTS } from "@/lib/mock/revio-demo";
import { PreviewBanner } from "./shared";

const FILTERS = ["Toutes", "Maths", "SVT", "Histoire", "Chimie"];

/** Mock-up of the sheets (Fusion-05-Fiches): search, subject filters, the stack, subjects, shared sheets. */
export function PreviewFiches() {
  const [filter, setFilter] = useState("Toutes");
  const searchId = useId();
  const subjects = DEMO_SUBJECTS.filter((s) => filter === "Toutes" || s.name === filter);
  return (
    <>
      <PageHeader title="Aperçu : mes fiches" description="42 fiches · 618 cartes" />
      <PreviewBanner>
        Les fiches et les cartes de révision n&apos;existent pas encore dans Revio.
      </PreviewBanner>
      <div className="space-y-8">
        <div className="space-y-3">
          <Label htmlFor={searchId} className="sr-only">
            Rechercher dans mes fiches
          </Label>
          <div className="relative max-w-md">
            <Search
              aria-hidden
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={searchId}
              placeholder="Rechercher dans mes fiches"
              className="h-11 rounded-pill pl-9"
              disabled
            />
          </div>
          <div role="group" aria-label="Filtrer par matière" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "min-h-11 rounded-pill border px-4 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  filter === f ? "border-brand bg-brand text-brand-foreground" : "bg-card",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <section aria-labelledby="today-title" className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <h2 id="today-title" className="font-heading text-lg font-semibold">
              À réviser aujourd&apos;hui
            </h2>
            <p className="text-sm text-muted-foreground">32 cartes · ≈ 14 min · 4 matières</p>
            <p>
              <span className="rounded-pill bg-revio-lime px-2.5 py-1 text-xs font-bold text-revio-midnight">
                +60 XP
              </span>
            </p>
            <Button disabled className="min-h-11 px-5">
              Commencer
            </Button>
          </div>
          <FlashcardStack cards={DEMO_CARDS} />
        </section>

        <section aria-labelledby="subjects-title" className="space-y-3">
          <h2 id="subjects-title" className="font-heading text-lg font-semibold">
            Mes matières
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {subjects.map((s) => (
              <li key={s.id}>
                <RevioSubjectCard subject={s} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shared-title" className="max-w-md space-y-3">
          <h2 id="shared-title" className="font-heading text-lg font-semibold">
            Partagées par tes amis
          </h2>
          <SharedSheetCard sheet={DEMO_SHEET} />
        </section>
      </div>
    </>
  );
}
