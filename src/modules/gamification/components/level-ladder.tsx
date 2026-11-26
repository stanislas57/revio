import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "../domain/levels";

const nf = new Intl.NumberFormat("fr-FR");

/** All levels, unlocked or still to reach. */
export function LevelLadder({ currentLevel }: { currentLevel: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {LEVELS.map((l) => {
        const unlocked = l.number <= currentLevel;
        return (
          <li
            key={l.number}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm",
              l.number === currentLevel && "border-brand/60 bg-brand-soft",
              !unlocked && "text-muted-foreground",
            )}
          >
            {unlocked ? (
              <Check className="size-4 text-brand-text" aria-label="Débloqué" />
            ) : (
              <Lock className="size-4" aria-label="À débloquer" />
            )}
            <span className="font-medium">
              {l.number}. {l.name}
            </span>
            <span className="tabular-nums">· {nf.format(l.minXp)} XP</span>
          </li>
        );
      })}
    </ol>
  );
}
