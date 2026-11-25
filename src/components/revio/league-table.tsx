"use client";

// Inspiration : Motion (layout animations, MIT) · implémentation originale pour Revio
import { ChevronUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { rankLeague, type LeagueRow } from "./logic";

/**
 * A league of about thirty students. Rows are re-ordered with an animated `layout` (a fade with reduced motion).
 * The user's row is violet with a "▲ N" badge when places were gained. `gained` is computed by the caller.
 */
export function LeagueTable({
  title,
  endsIn,
  rows,
  gained = {},
}: {
  title: string;
  endsIn: string;
  rows: LeagueRow[];
  /** Places gained, by row id. */
  gained?: Record<string, number>;
}) {
  const reduced = useReducedMotion();
  const ranked = rankLeague(rows);
  return (
    <section aria-labelledby="league-title" className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="league-title" className="font-heading text-lg font-semibold">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">{endsIn}</span>
      </div>
      <ol
        tabIndex={0}
        aria-label="Classement de la ligue"
        className="max-h-96 space-y-1.5 overflow-y-auto rounded-md pr-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {ranked.map((row) => {
          const up = gained[row.id] ?? 0;
          return (
            <motion.li
              key={row.id}
              layout={!reduced}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              aria-current={row.isMe ? "true" : undefined}
              aria-label={`${row.rank}, ${row.isMe ? "toi" : row.name}, ${new Intl.NumberFormat("fr-FR").format(row.xp)} XP${up > 0 ? `, monté de ${up} place${up > 1 ? "s" : ""}` : ""}`}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                row.isMe
                  ? "bg-brand font-semibold text-brand-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <span aria-hidden className="w-6 text-right tabular-nums">
                {row.rank}
              </span>
              <span aria-hidden className="min-w-0 flex-1 truncate">
                {row.isMe ? "Toi" : row.name}
              </span>
              {up > 0 && (
                <span
                  aria-hidden
                  className="inline-flex items-center rounded-pill bg-revio-lime px-2 py-0.5 text-xs font-bold text-revio-midnight"
                >
                  <ChevronUp className="size-3" />
                  {up}
                </span>
              )}
              <span aria-hidden className="tabular-nums">
                {new Intl.NumberFormat("fr-FR").format(row.xp)}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
