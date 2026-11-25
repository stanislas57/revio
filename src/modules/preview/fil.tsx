"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Users } from "lucide-react";
import { KudosButton } from "@/components/revio/kudos-button";
import { ReactionBar, type ReactionId } from "@/components/revio/reaction-bar";
import { SharedSheetCard } from "@/components/revio/shared-sheet-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_SHEET } from "@/lib/mock/revio-demo";
import { PreviewBanner } from "./shared";

const TABS = ["Amis", "Ma classe", "Groupes"] as const;

/** Mock-up of the social feed (Fusion-02-Fil): tabs, "join" banner, shared sheets, kudos. */
export function PreviewFil() {
  const [tab, setTab] = useState(0);
  const [reaction, setReaction] = useState<ReactionId | null>(null);
  const [kudos, setKudos] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % TABS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + TABS.length) % TABS.length
          : null;
    if (next === null) return;
    e.preventDefault();
    setTab(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <PageHeader title="Aperçu : fil" description="Ce que tes amis partagent." />
      <PreviewBanner>
        Les fiches partagées, les classes et les groupes n&apos;existent pas encore dans Revio.
      </PreviewBanner>
      <div className="max-w-xl space-y-4">
        <div role="tablist" aria-label="Fil" className="flex gap-1 rounded-pill bg-secondary p-1">
          {TABS.map((name, i) => (
            <button
              key={name}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`fil-tab-${i}`}
              aria-selected={i === tab}
              aria-controls="fil-panel"
              tabIndex={i === tab ? 0 : -1}
              onClick={() => setTab(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "min-h-11 flex-1 rounded-pill text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                i === tab ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <div id="fil-panel" role="tabpanel" aria-labelledby={`fil-tab-${tab}`} className="space-y-4">
          {tab === 0 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <p className="text-sm">
                  <span className="font-semibold">2 amis</span> révisent la SVT en direct
                </p>
                <Button disabled className="min-h-11 rounded-pill px-5">
                  Rejoindre
                </Button>
              </div>
              <SharedSheetCard sheet={DEMO_SHEET} />
              <div className="space-y-3 rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold">Léo a atteint 23 jours de série</p>
                <p className="text-xs text-muted-foreground">Nouveau record perso · à l&apos;instant</p>
                <div className="flex items-center gap-3">
                  <KudosButton friendName="Léo" sent={kudos} onSend={() => setKudos(true)} />
                  <ReactionBar value={reaction} onChange={setReaction} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tes kudos de la semaine : 8 · visibles par toi seul·e
              </p>
            </>
          ) : (
            <EmptyState
              icon={Users}
              title={`${TABS[tab]} : bientôt`}
              description="Cette partie du fil n'existe pas encore dans Revio."
            />
          )}
        </div>
      </div>
    </>
  );
}
