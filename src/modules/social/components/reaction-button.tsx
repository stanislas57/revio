"use client";

import { useOptimistic, useTransition } from "react";
import { HandHeart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleReaction } from "../server/actions";

/**
 * "Bravo" button. The default handler is the real Server Action; a parent can
 * pass its own `onToggle` (fixtures, tests). The database decides the final state.
 */
export function ReactionButton({
  postId,
  count,
  reacted,
  onToggle = toggleReaction,
}: {
  postId: string;
  count: number;
  reacted: boolean;
  onToggle?: typeof toggleReaction;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ count, reacted });
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={state.reacted}
      disabled={pending}
      className={cn(state.reacted && "text-pink-600 dark:text-pink-400")}
      onClick={() =>
        startTransition(async () => {
          const next = !state.reacted;
          setOptimistic({ count: state.count + (next ? 1 : -1), reacted: next });
          const res = await onToggle(postId);
          if (!res.ok) toast.error(res.error.message);
        })
      }
    >
      <HandHeart aria-hidden className={cn(state.reacted && "fill-current")} />
      <span>{state.reacted ? "Bravo envoyé" : "Bravo"}</span>
      <span className="tabular-nums" aria-label={`${state.count} bravo${state.count > 1 ? "s" : ""}`}>
        · {state.count}
      </span>
    </Button>
  );
}
