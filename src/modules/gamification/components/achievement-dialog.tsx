"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Achievement } from "../contracts";
import { CATEGORY_LABEL, achievementState, progressPercent, stateLabel } from "../domain/achievements";
import { AchievementIcon } from "./achievement-icon";
import { ProgressBar } from "./progress-bar";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

/**
 * Detail window. Radix gives it the dialog role, a focus trap, Escape to close and the return
 * of the focus to the card that opened it. The shared close button is English and 16px, so it is
 * hidden here and replaced by a French 44px "Fermer" button.
 */
export function AchievementDialog({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  const state = achievement ? achievementState(achievement) : null;
  const percent = achievement ? progressPercent(achievement) : null;

  return (
    <Dialog open={achievement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        {achievement && state && (
          <>
            <DialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground"
                >
                  <AchievementIcon achievement={achievement} className="size-6" />
                </span>
                <DialogTitle className="text-xl break-words">{achievement.name}</DialogTitle>
              </div>
              <DialogDescription className="text-base">{achievement.description}</DialogDescription>
            </DialogHeader>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <dt className="text-muted-foreground">Statut</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-medium">
                  {state === "unlocked" && <Check className="size-4 text-brand-text" aria-hidden />}
                  {stateLabel(state)}
                </dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="text-muted-foreground">Catégorie</dt>
                <dd className="mt-1 font-medium">{CATEGORY_LABEL[achievement.category]}</dd>
              </div>
              {achievement.unlockedAt && (
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <dt className="text-muted-foreground">Obtenu le</dt>
                  <dd className="mt-1 font-medium">{dateFmt.format(new Date(achievement.unlockedAt))}</dd>
                </div>
              )}
              {achievement.progress && state !== "unlocked" && (
                <div className="space-y-2 rounded-lg border p-3 sm:col-span-2">
                  <dt className="text-muted-foreground">Progression</dt>
                  <dd className="space-y-2">
                    <span className="block font-medium tabular-nums">
                      {achievement.progress.current} sur {achievement.progress.target}
                      {percent !== null && ` (${percent} %)`}
                    </span>
                    {percent !== null && (
                      <ProgressBar
                        value={percent}
                        label={`Progression de ${achievement.name}`}
                        barClassName="bg-brand"
                      />
                    )}
                  </dd>
                </div>
              )}
            </dl>

            <p className="text-xs text-muted-foreground">
              Données d&apos;exemple : le catalogue et l&apos;attribution viendront du serveur.
            </p>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto">
                  Fermer
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
