"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Relation, UserSearchResult } from "../contracts";
import { userLabel } from "../domain/names";
import { searchUsers } from "../server/actions";
import { AddFriendButton } from "./friend-buttons";
import { UserAvatar } from "./user-avatar";

const RELATION_LABEL: Partial<Record<Relation, string>> = {
  friends: "Déjà ami",
  outgoing_pending: "Demande envoyée",
  incoming_pending: "T'a envoyé une demande",
};

export function FriendSearch() {
  const [results, setResults] = useState<UserSearchResult[] | null>(null);
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
            setError(res.ok ? null : res.error.message);
            setResults(res.ok ? res.data : null);
          });
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="friend-q">Pseudo de ton ami</Label>
          <Input
            id="friend-q"
            name="q"
            minLength={3}
            maxLength={24}
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
        <p className="text-sm text-muted-foreground">
          Personne trouvé. Tape le début du pseudo exact de ton ami.
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {results.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-3 py-2">
              <UserAvatar user={u} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{userLabel(u)}</p>
                {u.username && <p className="truncate text-xs text-muted-foreground">@{u.username}</p>}
              </div>
              {u.relation === "none" ? (
                <AddFriendButton
                  userId={u.id}
                  onDone={() =>
                    setResults(
                      (rs) =>
                        rs?.map((r) => (r.id === u.id ? { ...r, relation: "outgoing_pending" } : r)) ?? null,
                    )
                  }
                />
              ) : (
                <span className="text-xs text-muted-foreground">{RELATION_LABEL[u.relation]}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
