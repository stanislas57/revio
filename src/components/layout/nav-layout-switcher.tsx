"use client";

import { useId, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LAYOUT_LABELS, NAV_LAYOUTS, type NavLayout } from "./nav-layout";
import { useNavLayout } from "./nav-layout-provider";

/** Mini wireframe of the page: the grey bars stand for the menu entries, the violet one for the active entry. */
function Preview({ layout }: { layout: NavLayout }) {
  const bars = (
    <>
      <span className="h-2 rounded-full bg-brand-soft-foreground/70" />
      <span className="h-2 rounded-full bg-muted-foreground/30" />
      <span className="h-2 rounded-full bg-muted-foreground/30" />
      <span className="h-2 rounded-full bg-muted-foreground/30" />
    </>
  );
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-32 w-full overflow-hidden rounded-2xl border bg-background",
        layout === "top" && "flex-col",
      )}
    >
      {layout === "sidebar" ? (
        <span className="flex w-1/4 flex-col gap-2 border-r bg-card p-3">
          <span className="mb-1 h-2.5 w-2/3 rounded-full bg-primary" />
          {bars}
        </span>
      ) : (
        <span className="flex h-1/4 min-h-8 items-center gap-2 border-b bg-card px-3">
          <span className="h-2.5 w-8 shrink-0 rounded-full bg-primary" />
          <span className="grid flex-1 grid-cols-4 gap-2">{bars}</span>
        </span>
      )}
      <span className="flex flex-1 flex-col items-center justify-center gap-2 p-3">
        <span className="h-3 w-1/2 rounded-full bg-muted-foreground/25" />
        <span className="h-10 w-3/4 rounded-2xl bg-card shadow-sm ring-1 ring-border" />
      </span>
    </span>
  );
}

/** "Barre latérale à gauche" or "Barre horizontale en haut": two big preview cards, applied at once and saved. */
export function NavLayoutSwitcher() {
  const { layout, choose } = useNavLayout();
  const name = useId();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function pick(next: NavLayout) {
    if (next === layout) return;
    setMessage(null);
    start(async () => {
      const res = await choose(next);
      setMessage(
        res.ok
          ? { ok: true, text: "Disposition enregistrée." }
          : { ok: false, text: `${res.error.message} Elle reste appliquée sur cet appareil.` },
      );
    });
  }

  return (
    <fieldset className="space-y-4" disabled={pending}>
      <legend className="mb-3 w-full text-center text-sm font-medium">Disposition du menu</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {NAV_LAYOUTS.map((value) => {
          const selected = layout === value;
          return (
            <label
              key={value}
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 p-4 text-center transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 motion-reduce:transition-none",
                selected ? "border-primary bg-brand-soft" : "bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={selected}
                onChange={() => pick(value)}
                className="sr-only"
              />
              <Preview layout={value} />
              <span className="space-y-1">
                <span className="block font-bold">{NAV_LAYOUT_LABELS[value].title}</span>
                <span className="block text-sm text-muted-foreground">{NAV_LAYOUT_LABELS[value].hint}</span>
              </span>
              {selected && (
                <span
                  aria-hidden
                  className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="size-4" />
                </span>
              )}
            </label>
          );
        })}
      </div>
      <p
        role="status"
        className={cn(
          "min-h-6 text-center text-sm",
          message?.ok ? "text-revio-success-text" : "text-destructive",
        )}
      >
        {message?.text}
      </p>
    </fieldset>
  );
}
