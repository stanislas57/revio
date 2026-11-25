"use client";

import { useState, useTransition } from "react";
import { EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type ParticipationHandler = () => Promise<ActionResult<unknown>>;

const NOT_READY = "Disponible quand le serveur sera prêt (tâche S-19).";

/**
 * Leave or rejoin the leaderboard. The handlers come from the server layer; without them the
 * buttons stay disabled and say why, instead of looking like they work.
 */
export function Participation({
  state,
  onLeave,
  onJoin,
}: {
  state: "in" | "out";
  onLeave?: ParticipationHandler;
  onJoin?: ParticipationHandler;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = (handler: ParticipationHandler, then?: () => void) =>
    startTransition(async () => {
      const res = await handler();
      if (!res.ok) toast.error(res.error.message);
      else then?.();
    });

  if (state === "out") {
    return (
      <section
        aria-labelledby="participation-title"
        className="space-y-3 rounded-xl border border-dashed p-4"
      >
        <h2 id="participation-title" className="flex items-center gap-2 font-semibold">
          <EyeOff className="size-4" aria-hidden /> Tu as quitté le classement
        </h2>
        <p className="text-sm text-muted-foreground">
          Tes amis ne voient plus tes XP ici, et tu ne vois plus les leurs. Tu peux revenir quand tu veux.
        </p>
        <Button
          type="button"
          className="min-h-11"
          disabled={!onJoin || pending}
          onClick={() => onJoin && run(onJoin)}
        >
          Revenir dans le classement
        </Button>
        {!onJoin && <p className="text-sm text-muted-foreground">{NOT_READY}</p>}
      </section>
    );
  }

  return (
    <section aria-labelledby="participation-title" className="space-y-3 rounded-xl border p-4">
      <h2 id="participation-title" className="font-semibold">
        Participation
      </h2>
      <p className="text-sm text-muted-foreground">
        Seuls tes XP apparaissent ici. Tes notes, tes moyennes et tes matières n&apos;y figurent jamais. Tu
        peux quitter le classement à tout moment.
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" className="min-h-11" disabled={!onLeave || pending}>
            <LogOut aria-hidden /> Quitter le classement
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter le classement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tes XP ne seront plus visibles de tes amis dans ce classement et tu ne verras plus les leurs. Tu
              pourras revenir quand tu veux. Tes XP et ta progression ne changent pas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => onLeave && run(onLeave)}>
              Quitter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!onLeave && <p className="text-sm text-muted-foreground">{NOT_READY}</p>}
    </section>
  );
}
