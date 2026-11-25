"use client";

// Inspiration : Magic UI — Animated List (MIT), shadcn/ui — Sonner (MIT) · implémentation originale pour Revio
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type LiveItem = { id: string; text: string; time: string };

/** Live activity: three entries at most, the new ones come from the bottom, the older ones fade. */
export function LiveActivityFeed({ items }: { items: LiveItem[] }) {
  const reduced = useReducedMotion();
  const shown = items.slice(-3);
  return (
    <section aria-labelledby="live-title" className="space-y-2">
      <h2 id="live-title" className="font-heading text-lg font-semibold">
        En direct
      </h2>
      <div role="log" aria-live="polite" aria-relevant="additions">
        <ul className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((item, i) => {
              const age = shown.length - 1 - i; // 0 = newest
              return (
                <motion.li
                  key={item.id}
                  layout={!reduced}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={reduced ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 24 }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm",
                    // Older entries fade by their colours, never by opacity (opacity would drop the text under 4.5:1).
                    age === 0
                      ? "bg-card text-foreground"
                      : age === 1
                        ? "bg-card/60 text-muted-foreground"
                        : "border-transparent bg-transparent text-muted-foreground",
                  )}
                >
                  <span>{item.text}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
