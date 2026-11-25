"use client";

import { useTransition } from "react";
import { Check, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import {
  cancelFriendRequest,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from "../server/actions";

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, success?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error.message);
      else if (success) toast.success(success);
    });
  return { pending, run };
}

export function AddFriendButton({ userId, onDone }: { userId: string; onDone?: () => void }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        run(async () => {
          const res = await sendFriendRequest(userId);
          if (res.ok) onDone?.();
          return res;
        }, "Demande envoyée")
      }
    >
      <UserPlus aria-hidden /> Ajouter
    </Button>
  );
}

export function IncomingRequestButtons({ requestId }: { requestId: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(() => respondFriendRequest(requestId, "accept"), "Vous êtes amis !")}
      >
        <Check aria-hidden /> Accepter
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => respondFriendRequest(requestId, "decline"))}
      >
        <X aria-hidden /> Refuser
      </Button>
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => run(() => cancelFriendRequest(requestId))}
    >
      <X aria-hidden /> Annuler
    </Button>
  );
}

export function RemoveFriendButton({ friendshipId, name }: { friendshipId: string; name: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      aria-label={`Retirer ${name} de mes amis`}
      title="Retirer des amis"
      onClick={() => {
        if (window.confirm(`Retirer ${name} de tes amis ?`)) run(() => removeFriend(friendshipId));
      }}
    >
      <UserMinus aria-hidden />
    </Button>
  );
}
