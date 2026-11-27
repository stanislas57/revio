"use client";

import { useState, useSyncExternalStore } from "react";
import { Camera, Copy, MessageCircle, Send, Share2, Smartphone } from "lucide-react";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { inviteMessage, inviteUrl, shareLink, type ShareTarget } from "../domain/invite";
import { QrCode } from "./qr-code";

const noopSubscribe = () => () => {};

type Status = { kind: "idle" } | { kind: "copied"; text: string } | { kind: "manual" };

/**
 * « Inviter un ami » : a personal link (`/invite/<username>`), its QR code and sharing buttons. No API key, no
 * paid service: the phone's share sheet (`navigator.share`, which lists Instagram, Snapchat, Messenger…), and
 * the public links of WhatsApp, SMS and Snapchat's web share. Instagram and Messenger have no web link: they use
 * the share sheet, or the link is copied with a note to paste it in a message. The link only carries the
 * username (public); whoever opens it is asked to sign up or sign in, then the friend request is sent.
 */
export function ShareInvite({ username }: { username: string }) {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const url = origin ? inviteUrl(origin, username) : "";
  const message = inviteMessage(username, url || undefined);
  const text = "Salut ! Je révise avec Revio, une appli de révision avec des amis. Rejoins-moi :";

  async function copy(note: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: "copied", text: note });
    } catch {
      setStatus({ kind: "manual" });
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Revio", text, url });
    } catch {
      // Cancelled by the user (AbortError) or refused: nothing to do.
    }
  }

  const link = (target: ShareTarget) => shareLink(target, url, text);
  const disabled = url === "";
  const linkClass = "w-full gap-2 " + (disabled ? "pointer-events-none opacity-50" : "");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-extrabold">Invite un ami</h3>
        <p className="text-sm text-muted-foreground">
          Envoie ton lien personnel : quand ton ami crée son compte ou se connecte, la demande d&apos;ami part
          toute seule. Le lien ne contient que ton pseudo, <strong>{username}</strong>.
        </p>
      </div>

      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        {url ? <QrCode value={url} className="size-48 rounded-2xl border bg-white p-1" /> : null}
        <p className="text-sm font-semibold break-all" data-testid="invite-url">
          {url || "…"}
        </p>
      </div>

      <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
        {canShare && (
          <ChunkyButton size="lg" className="sm:col-span-2" onClick={share} disabled={disabled}>
            <Share2 aria-hidden /> Partager…
          </ChunkyButton>
        )}
        <ChunkyButton asChild size="lg" variant="outline" className={linkClass}>
          <a href={link("whatsapp")} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden /> WhatsApp
          </a>
        </ChunkyButton>
        <ChunkyButton asChild size="lg" variant="outline" className={linkClass}>
          <a href={link("sms")}>
            <Smartphone aria-hidden /> SMS
          </a>
        </ChunkyButton>
        <ChunkyButton asChild size="lg" variant="outline" className={linkClass}>
          <a href={link("snapchat")} target="_blank" rel="noopener noreferrer">
            <Camera aria-hidden /> Snapchat
          </a>
        </ChunkyButton>
        <ChunkyButton
          size="lg"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            canShare ? void share() : void copy("Lien copié, colle-le en message privé sur Instagram.")
          }
        >
          <Send aria-hidden /> Instagram
        </ChunkyButton>
        <ChunkyButton
          size="lg"
          variant="outline"
          disabled={disabled}
          onClick={() => (canShare ? void share() : void copy("Lien copié, colle-le dans Messenger."))}
        >
          <MessageCircle aria-hidden /> Messenger
        </ChunkyButton>
        <ChunkyButton
          size="lg"
          variant="secondary"
          disabled={disabled}
          onClick={() => void copy("Lien copié.")}
        >
          <Copy aria-hidden /> Copier le lien
        </ChunkyButton>
      </div>

      {status.kind === "manual" && (
        <textarea
          readOnly
          rows={3}
          aria-label="Message d'invitation à copier"
          defaultValue={message}
          onFocus={(e) => e.currentTarget.select()}
          className="mx-auto block w-full max-w-md rounded-xl border-2 bg-background p-3 text-center text-sm"
        />
      )}
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {status.kind === "copied" && status.text}
        {status.kind === "manual" && "Copie impossible ici : sélectionne le message ci-dessus et copie-le."}
      </p>
    </div>
  );
}
