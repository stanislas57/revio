import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS, getLevelProgress } from "../domain/levels";

const nf = new Intl.NumberFormat("fr-FR");

/** All levels, unlocked or to reach. */
export function LevelLadder({ totalXp }: { totalXp: number }) {
  const current = getLevelProgress(totalXp).current.level;
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {LEVELS.map((l) => {
        const unlocked = l.level <= current;
        return (
          <li
            key={l.level}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              l.level === current && "border-violet-500/60 bg-violet-500/10",
              !unlocked && "text-muted-foreground",
            )}
          >
            {unlocked ? (
              <Check className="size-4 text-violet-500" aria-label="Débloqué" />
            ) : (
              <Lock className="size-4" aria-label="À débloquer" />
            )}
            <span className="font-medium">
              {l.level}. {l.name}
            </span>
            <span className="ml-auto tabular-nums">{nf.format(l.minXp)} XP</span>
          </li>
        );
      })}
    </ol>
  );
}
