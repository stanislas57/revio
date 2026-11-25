import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLevelProgress } from "../domain/levels";
import { ProgressBar } from "./progress-bar";

const nf = new Intl.NumberFormat("fr-FR");

/** Current level, total XP and progress to the next level. */
export function LevelCard({ totalXp }: { totalXp: number }) {
  const p = getLevelProgress(totalXp);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-violet-500" aria-hidden />
          Niveau {p.current.level} · {p.current.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tabular-nums">
          {nf.format(p.totalXp)} <span className="text-base font-medium text-muted-foreground">XP</span>
        </p>
        <ProgressBar
          value={p.percent}
          label={p.next ? `Progression vers ${p.next.name}` : "Niveau maximum"}
          barClassName="bg-violet-500"
        />
        <p className="text-sm text-muted-foreground">
          {p.next
            ? `Encore ${nf.format(p.xpRemaining)} XP pour atteindre ${p.next.name} (${p.percent} %).`
            : "Niveau maximum atteint."}
        </p>
      </CardContent>
    </Card>
  );
}
