"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptPendingInvite } from "../server/invite-actions";

/**
 * Rendered by the app layout only when an invitation is remembered: sends the friend request once, then tells
 * the user in a toast (a polite live region). Renders nothing.
 */
export function InviteAcceptor() {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // React runs effects twice in development
    started.current = true;
    void acceptPendingInvite().then((res) => {
      if (res.status === "sent") {
        toast.success(`Demande d'ami envoyée à ${res.name}.`);
        router.refresh();
      } else if (res.status === "already") toast.message("Vous êtes déjà en contact.");
      else if (res.status === "self") toast.message("C'est ton propre lien d'invitation.");
      else if (res.status === "unknown") toast.error("Cette invitation n'est plus valable.");
    });
  }, [router]);
  return null;
}
