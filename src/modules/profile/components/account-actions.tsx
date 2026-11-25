"use client";

import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_CONFIRMATION, isDeleteConfirmed } from "../domain/account-export";
import { deleteMyAccount } from "../server/account-actions";

/** Export of the user's data (a real download) and irreversible account deletion. */
export function AccountActions() {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11">
          {/* A plain link: the browser downloads the JSON file. */}
          <a href="/profil/export" download>
            <Download className="size-4" aria-hidden />
            Exporter mes données
          </a>
        </Button>

        <AlertDialog
          onOpenChange={() => {
            setTyped("");
            setError(null);
          }}
        >
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" className="min-h-11 text-destructive">
              <Trash2 className="size-4" aria-hidden />
              Supprimer mon compte
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement ton compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Ton profil, tes matières, tes notes, tes séances, ton XP, tes publications et tes amitiés sont
                effacés immédiatement. Cette action est irréversible. Pense à exporter tes données avant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">Pour confirmer, tape {DELETE_CONFIRMATION}</Label>
              <Input
                id="delete-confirmation"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              {/* Not AlertDialogAction: it would close the dialog before the server answers. */}
              <Button
                type="button"
                variant="destructive"
                disabled={!isDeleteConfirmed(typed) || pending}
                onClick={() =>
                  start(async () => {
                    const res = await deleteMyAccount({ confirmation: typed });
                    // On success the action redirects and never returns.
                    if (res && !res.ok) setError(res.error.message);
                  })
                }
              >
                {pending ? "Suppression…" : "Supprimer définitivement"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="text-xs text-muted-foreground">
        L&apos;export est un fichier JSON avec tes données uniquement (jamais celles de tes amis).
      </p>
    </div>
  );
}
