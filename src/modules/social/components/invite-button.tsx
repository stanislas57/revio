"use client";

import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inviteMessage } from "../domain/invite";

type Status = { kind: "idle" } | { kind: "copied" } | { kind: "manual" };

/**
 * "Inviter un ami": copies a ready-made message that contains the user's username (no link, no table).
 * The result is written in a polite live region so screen readers announce it. If the browser refuses
 * to copy (insecure page, permission), the message is shown selected so it can be copied by hand.
 */
export function InviteButton({ username }: { username: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const message = inviteMessage(username);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setStatus({ kind: "copied" });
    } catch {
      setStatus({ kind: "manual" });
      // The textarea is rendered by this state change: select it on the next frame.
      requestAnimationFrame(() => textRef.current?.select());
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="min-h-11" onClick={copy}>
        <Copy className="size-4" aria-hidden />
        Inviter un ami
      </Button>
      <p className="text-xs text-muted-foreground">
        Copie un message avec ton pseudo, <strong>{username}</strong>, à envoyer à un ami qui n&apos;est pas
        encore sur Revio.
      </p>
      {status.kind === "manual" && (
        <textarea
          ref={textRef}
          readOnly
          rows={3}
          aria-label="Message d'invitation à copier"
          defaultValue={message}
          className="w-full rounded-md border bg-background p-2 text-sm"
        />
      )}
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {status.kind === "copied" && "Message copié. Colle-le dans une conversation avec ton ami."}
        {status.kind === "manual" && "Copie impossible ici : sélectionne le message ci-dessus et copie-le."}
      </p>
    </div>
  );
}
