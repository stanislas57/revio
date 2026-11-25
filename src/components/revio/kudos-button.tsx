"use client";

// Inspiration : Magic UI — Cool Mode (MIT) · implémentation originale pour Revio
import { useRef } from "react";
import { HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { celebrate } from "./confetti";

/**
 * The kudos pill (gradient, the only place besides presence and the "Réviser" button). A burst of violet, magenta
 * and white particles plays once per click. Anti-pressure rules: one kudos per day and per friend (`sent`
 * disables the button) and the number of kudos is NEVER shown here: it stays private to its owner.
 */
export function KudosButton({
  friendName,
  sent,
  onSend,
  className,
}: {
  friendName: string;
  /** A kudos was already sent to this friend today. */
  sent: boolean;
  onSend: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function send() {
    const box = ref.current?.getBoundingClientRect();
    if (box) {
      void celebrate({
        particleCount: 36,
        origin: {
          x: (box.left + box.width / 2) / window.innerWidth,
          y: (box.top + box.height / 2) / window.innerHeight,
        },
      });
    }
    onSend();
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={send}
        disabled={sent}
        className={cn(
          "bg-revio-gradient-solid inline-flex min-h-11 items-center gap-2 rounded-pill px-5 text-sm font-semibold text-white outline-none",
          "transition-transform duration-[var(--dur-micro)] hover:scale-[1.03] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-70 disabled:hover:scale-100",
          className,
        )}
      >
        <HandHeart className="size-4" aria-hidden />
        {sent ? "Kudos envoyé" : "Kudos"}
        <span className="sr-only"> à {friendName}</span>
      </button>
      <span role="status" className="sr-only">
        {sent ? `Kudos envoyé à ${friendName}. Un seul par jour.` : ""}
      </span>
    </>
  );
}
