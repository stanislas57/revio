"use client";

// Implémentation originale pour Revio avec Motion (drag, MIT) — aucun code copié
import { useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { nextStack, type Verdict } from "./logic";

export type Flashcard = { id: string; subject: string; front: string; back: string };

const SWIPE_DISTANCE = 110;

/**
 * A stack of flashcards: tap to flip (3D, or a simple fade with reduced motion), swipe right for "Je sais" and left
 * for "À revoir". The two buttons below ALWAYS exist and do the same thing, so nothing depends on a gesture.
 */
export function FlashcardStack({
  cards,
  onVerdict,
}: {
  cards: Flashcard[];
  onVerdict?: (card: Flashcard, verdict: Verdict) => void;
}) {
  const reduced = useReducedMotion();
  const [stack, setStack] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [toReview, setToReview] = useState(0);
  const dragged = useRef(false);
  const x = useMotionValue(0);
  const tilt = useTransform(x, [-200, 200], [-10, 10]);
  const top = stack[0];

  function decide(verdict: Verdict) {
    if (!top) return;
    onVerdict?.(top, verdict);
    if (verdict === "know") setKnown((n) => n + 1);
    else setToReview((n) => n + 1);
    setStack((s) => nextStack(s, verdict));
    setFlipped(false);
    x.set(0);
  }

  if (!top) {
    return (
      <div role="status" className="rounded-xl border bg-card p-6 text-center">
        <p className="font-heading text-xl font-bold">Pile terminée</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {known} carte{known > 1 ? "s" : ""} sue{known > 1 ? "s" : ""}, {toReview} à revoir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto h-56 w-full max-w-xs"
        aria-label={`Pile de cartes, ${stack.length} restante${stack.length > 1 ? "s" : ""}`}
      >
        {stack.slice(1, 3).map((card, i) => (
          <div
            key={card.id}
            aria-hidden
            className="absolute inset-0 rounded-xl border bg-card"
            style={{ transform: `translateY(${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.04})`, zIndex: -i - 1 }}
          />
        ))}
        <motion.div
          key={top.id}
          className="absolute inset-0 touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          style={{ x, rotate: reduced ? 0 : tilt }}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={(_, info) => {
            if (info.offset.x > SWIPE_DISTANCE) decide("know");
            else if (info.offset.x < -SWIPE_DISTANCE) decide("review");
            window.setTimeout(() => (dragged.current = false), 0);
          }}
        >
          <button
            type="button"
            onClick={() => !dragged.current && setFlipped((f) => !f)}
            className="relative size-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            style={{ perspective: 900 }}
          >
            <motion.span
              className="absolute inset-0 block"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: reduced ? 0 : flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {(
                [
                  ["front", top.front, false],
                  ["back", top.back, true],
                ] as const
              ).map(([face, text, back]) => (
                <span
                  key={face}
                  aria-hidden={back !== flipped}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-6 text-center shadow-sm",
                    back && "bg-secondary",
                  )}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: back && !reduced ? "rotateY(180deg)" : undefined,
                    opacity: reduced ? (back === flipped ? 1 : 0) : 1,
                  }}
                >
                  <span className="text-xs font-semibold text-revio-magenta-text">
                    {top.subject} · {back ? "Réponse" : "Question"}
                  </span>
                  <span className="font-heading text-xl font-bold">{text}</span>
                </span>
              ))}
            </motion.span>
            <span className="sr-only">
              . {flipped ? "Voir la question" : "Retourner la carte pour voir la réponse"}
            </span>
          </button>
        </motion.div>
      </div>
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => decide("review")}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill border bg-card px-5 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <RotateCcw className="size-4" aria-hidden /> À revoir
        </button>
        <button
          type="button"
          onClick={() => decide("know")}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-revio-violet px-5 text-sm font-semibold text-white outline-none hover:bg-revio-violet-hover focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Je sais <Check className="size-4" aria-hidden />
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Touche la carte pour la retourner. Glisse à droite : je sais, à gauche : à revoir.
      </p>
      <p role="status" className="sr-only">
        {stack.length} carte{stack.length > 1 ? "s" : ""} restante{stack.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
