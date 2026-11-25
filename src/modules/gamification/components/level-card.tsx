import { Sparkles } from "lucide-react";
import { RevioRing } from "@/components/revio/revio-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelProgress } from "../contracts";

const nf = new Intl.NumberFormat("fr-FR");

/** Current level, total XP and progress to the next level, with the Revio ring. */
export function LevelCard({ level }: { level: LevelProgress }) {
  const percent = Math.floor(level.progress * 100);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-brand-text" aria-hidden />
          Niveau {level.current.number} · {level.current.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <RevioRing
          variant="progress"
          label={level.next ? `Progression vers ${level.next.name}` : "Niveau maximum"}
          value={level.progress}
          size={96}
          stroke={9}
        />
        <div className="min-w-0 space-y-2">
          <p className="text-3xl font-bold tabular-nums">
            {nf.format(level.totalXp)} <span className="text-base font-medium text-muted-foreground">XP</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {level.next && level.xpUntilNextLevel !== null
              ? `Encore ${nf.format(level.xpUntilNextLevel)} XP pour atteindre ${level.next.name} (${percent} %).`
              : "Niveau maximum atteint."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
