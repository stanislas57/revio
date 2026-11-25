"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "../server/profile-actions";

export function ProfileForm({ username, displayName }: { username: string; displayName: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
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
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          maxLength={60}
          autoComplete="nickname"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.info && (
        <p role="status" className="text-sm">
          {state.info}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
