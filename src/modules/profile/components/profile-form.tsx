"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "../server/profile-actions";

export function ProfileForm({ username, displayName }: { username: string; displayName: string }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await updateProfile({
            username: String(form.get("username") ?? ""),
            displayName: String(form.get("displayName") ?? ""),
          });
          setMessage(
            res.ok ? { ok: true, text: "Profil enregistré." } : { ok: false, text: res.error.message },
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
          className="h-11"
          id="username"
          name="username"
          defaultValue={username}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]{3,24}"
          autoComplete="off"
          required
        />
        <p className="text-xs text-muted-foreground">
          C&apos;est ce que tes amis tapent pour te trouver. Lettres, chiffres et _ (3 à 24).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom affiché</Label>
        <Input
          className="h-11"
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          maxLength={60}
          autoComplete="nickname"
        />
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "text-sm" : "text-sm text-destructive"}
        >
          {message.text}
        </p>
      )}
      <Button className="min-h-11" type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
