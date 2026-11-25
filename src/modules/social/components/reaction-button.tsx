"use client";

import { useOptimistic, useTransition } from "react";
import { HandHeart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleReaction } from "../server/actions";

/** "Encourager" button: optimistic UI, the database decides. */
export function ReactionButton({
  sessionId,
  count,
  reacted,
  disabled = false,
}: {
  sessionId: string;
  count: number;
  reacted: boolean;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ count, reacted });
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={state.reacted}
      disabled={disabled || pending}
      title={disabled ? "Tu ne peux pas encourager ta propre séance" : undefined}
      className={cn(state.reacted && "text-pink-600 dark:text-pink-400")}
      onClick={() =>
        startTransition(async () => {
          const next = !state.reacted;
          setOptimistic({ count: state.count + (next ? 1 : -1), reacted: next });
          const res = await toggleReaction(sessionId, next);
          if (res?.error) toast.error(res.error);
        })
      }
    >
      <HandHeart aria-hidden className={cn(state.reacted && "fill-current")} />
      <span>{state.reacted ? "Encouragé" : "Encourager"}</span>
      <span className="tabular-nums" aria-label={`${state.count} encouragement${state.count > 1 ? "s" : ""}`}>
        · {state.count}
      </span>
    </Button>
  );
}
