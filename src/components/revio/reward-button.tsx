"use client";

import { useState } from "react";
import { Check, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChunkyButton } from "./chunky-button";

/**
 * "Récupérer ma récompense": Electric Lime only while a reward is waiting. Once it is claimed (or when there is
 * nothing to claim) it takes the quiet secondary look of "Voir mes statistiques" and is disabled, with a written
 * state (never colour alone). The parent does the claiming in `onClaim` and passes `available`; without
 * `available`, the button keeps its own state (demos).
 */
export function RewardButton({
  available,
  onClaim,
  className,
}: {
  /** A reward is waiting. Leave it out to let the button track the claim by itself. */
  available?: boolean;
  onClaim?: () => void | Promise<void>;
  className?: string;
}) {
  const [claimed, setClaimed] = useState(false);
  const waiting = available ?? !claimed;
  return (
    <>
      <ChunkyButton
        variant={waiting ? "reward" : "secondary"}
        disabled={!waiting}
        // Claimed: exactly the look of "Voir mes statistiques" (secondary), not the faded disabled look.
        className={cn(!waiting && "disabled:opacity-100", className)}
        onClick={async () => {
          await onClaim?.();
          setClaimed(true);
        }}
      >
        {waiting ? <Gift aria-hidden /> : <Check aria-hidden />}
        {waiting ? "Récupérer ma récompense" : "Récompense récupérée"}
      </ChunkyButton>
      <span role="status" className="sr-only">
        {waiting ? "" : "Récompense récupérée."}
      </span>
    </>
  );
}
