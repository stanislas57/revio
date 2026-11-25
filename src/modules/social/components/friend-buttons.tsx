"use client";

import { useTransition } from "react";
import { Check, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  acceptFriendRequest,
  removeFriend,
  removeFriendship,
  sendFriendRequest,
  type SocialActionResult,
} from "../server/actions";

function useRun() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<SocialActionResult>, success?: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else if (success) toast.success(success);
    });
  return { pending, run };
}

export function AddFriendButton({ profileId }: { profileId: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => run(() => sendFriendRequest(profileId), "Demande envoyée")}
    >
      <UserPlus aria-hidden /> Ajouter
    </Button>
  );
}

export function RequestButtons({ friendshipId, received }: { friendshipId: string; received: boolean }) {
  const { pending, run } = useRun();
  if (!received) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => removeFriendship(friendshipId))}
      >
        <X aria-hidden /> Annuler
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(() => acceptFriendRequest(friendshipId), "Vous êtes amis !")}
      >
        <Check aria-hidden /> Accepter
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        aria-label="Refuser la demande"
        onClick={() => run(() => removeFriendship(friendshipId))}
      >
        <X aria-hidden /> Refuser
      </Button>
    </div>
  );
}

export function RemoveFriendButton({ profileId, name }: { profileId: string; name: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      aria-label={`Retirer ${name} de mes amis`}
      title="Retirer des amis"
      onClick={() => {
        if (window.confirm(`Retirer ${name} de tes amis ?`)) run(() => removeFriend(profileId));
      }}
    >
      <UserMinus aria-hidden />
    </Button>
  );
}
