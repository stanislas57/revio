"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { displayName } from "../domain/names";
import { searchUsers } from "../server/actions";
import type { SearchResult } from "../server/queries";
import { AddFriendButton } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

const RELATION_LABEL: Record<Exclude<SearchResult["relation"], "none">, string> = {
  friend: "Déjà ami",
  sent: "Demande envoyée",
  received: "T'a envoyé une demande",
};

export function FriendSearch() {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "");
          startTransition(async () => {
            const res = await searchUsers(q);
            if ("error" in res) {
              setError(res.error);
              setResults(null);
            } else {
              setError(null);
              setResults(res);
            }
          });
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="friend-q">Rechercher un pseudo ou un nom</Label>
          <Input
            id="friend-q"
            name="q"
            minLength={2}
            maxLength={40}
            placeholder="Ex. stani"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={pending} aria-label="Rechercher">
          <Search aria-hidden />
          <span className="hidden sm:inline">Rechercher</span>
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Personne trouvé. Vérifie le pseudo exact de ton ami.</p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {results.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <UserAvatar profile={p} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName(p)}</p>
                {p.username && <p className="truncate text-xs text-muted-foreground">@{p.username}</p>}
              </div>
              {p.relation === "none" ? (
                <AddFriendButton profileId={p.id} />
              ) : (
                <span className="text-xs text-muted-foreground">{RELATION_LABEL[p.relation]}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
