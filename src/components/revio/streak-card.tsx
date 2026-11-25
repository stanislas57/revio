"use client";

// Inspiration : Magic UI — Number Ticker (MIT) · implémentation originale pour Revio
import { Check, Flame, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

export type StreakDayState = "done" | "joker" | "today" | "empty";
export type StreakDay = { label: string; name: string; state: StreakDayState };

const STATE_TEXT: Record<StreakDayState, string> = {
  done: "validé",
  joker: "sauvé par un joker",
  today: "aujourd'hui",
  empty: "pas encore",
};

/**
 * The streak on a white card: Streak Orange flame, the number that slides, and the seven days of the week.
 * A day saved by a joker is violet, today is dashed. Each state also has its own mark and a text for screen readers.
 */
export function RevioStreakCard({
  days,
  weekDays,
  record,
  jokers,
  className,
}: {
  days: number;
  weekDays: StreakDay[];
  record: number;
  /** Jokers left. Leave it out when the product has none: nothing is shown. */
  jokers?: number;
  className?: string;
}) {
  return (
    <section
      aria-label="Série"
      className={cn("rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-lg bg-revio-streak">
          <Flame className="size-6 text-revio-midnight" />
        </span>
        <div>
          <p className="font-heading text-2xl font-extrabold">
            <AnimatedNumber value={days} /> jour{days > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Record {record} jour{record > 1 ? "s" : ""}
            {jokers !== undefined &&
              ` · ${jokers} joker${jokers > 1 ? "s" : ""} restant${jokers > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <li
            key={d.name}
            aria-label={`${d.name} : ${STATE_TEXT[d.state]}`}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-6 items-center justify-center rounded-full",
                d.state === "done" && "bg-revio-streak",
                d.state === "joker" && "bg-revio-primary",
                d.state === "today" && "border-2 border-dashed border-revio-streak-text",
                d.state === "empty" && "bg-muted",
              )}
            >
              {d.state === "done" && <Check className="size-3.5 text-revio-midnight" />}
              {d.state === "joker" && <ShieldCheck className="size-3.5 text-white" />}
            </span>
            <span
              aria-hidden
              className={cn(
                "text-xs",
                d.state === "today" ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {d.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
