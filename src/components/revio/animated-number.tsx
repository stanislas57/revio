"use client";

// Inspiration : Motion Primitives — Sliding Number (MIT) · implémentation originale pour Revio
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-FR");

/**
 * A number whose digits slide to their new value (tabular figures). Screen readers read the whole number once;
 * with reduced motion the digits change at once.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const text = nf.format(Math.max(0, Math.round(value)));
  return (
    <span className={cn("inline-flex tabular-nums", className)} role="text" aria-label={text}>
      {[...text].map((char, i) =>
        /\d/.test(char) ? (
          <span
            key={i}
            aria-hidden
            className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15]"
          >
            <motion.span
              className="flex flex-col"
              initial={false}
              animate={{ y: `${-Number(char) * 1.15}em` }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="h-[1.15em]">
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        ) : (
          <span key={i} aria-hidden className="whitespace-pre">
            {char}
          </span>
        ),
      )}
    </span>
  );
}
