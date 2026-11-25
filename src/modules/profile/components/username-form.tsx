"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "../server/profile-actions";

/**
 * Choose a username. Uses the same server action and Zod schema as the profile form; the browser's own
 * validation is turned off so the French server message (invalid format, already taken) is what is shown.
 */
export function UsernameForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const username = String(new FormData(e.currentTarget).get("username") ?? "");
        startTransition(async () => {
          const res = await updateProfile({ username });
          if (res.ok) {
            setError(null);
            router.refresh();
          } else {
            setError(res.error.message);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
          id="username"
          name="username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={24}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "username-hint username-error" : "username-hint"}
          className="h-11"
          autoFocus
          required
        />
        <p id="username-hint" className="text-xs text-muted-foreground">
          3 à 24 caractères : lettres minuscules, chiffres ou _. Les majuscules sont converties.
        </p>
        {error && (
          <p id="username-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="h-11 px-5">
        {pending ? "Enregistrement…" : "Continuer"}
      </Button>
    </form>
  );
}
