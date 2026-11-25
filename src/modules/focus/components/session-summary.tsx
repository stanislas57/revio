import Link from "next/link";
import { Clock, Flame, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import type { SessionResult } from "../contracts";
import { formatMinutes } from "../domain/format";
import { CountUp } from "./count-up";

const appear =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none";

/**
 * End-of-session recap. Every number comes from the official result computed by
 * the database (`finishSession`); nothing is computed or granted here.
 */
export function SessionSummary({ result }: { result: SessionResult }) {
  const { level, streak } = result;
  const percent = Math.floor(level.progress * 100);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className={cn("space-y-2 text-center", appear)}>
        <PartyPopper className="mx-auto size-10 text-violet-500" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">Séance terminée</h1>
        <p className="text-muted-foreground">{result.subjectName ?? "Révision"}</p>
      </div>

      <div className={cn("rounded-xl border p-6 text-center delay-150", appear)}>
        {result.belowMinimum ? (
          <>
            <p className="text-lg font-semibold">Séance trop courte pour rapporter de l&apos;XP</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Il faut au moins 5 minutes de révision. Elle est tout de même enregistrée.
            </p>
          </>
        ) : (
          <>
            <p className="text-5xl font-bold text-violet-600 dark:text-violet-400">
              +<CountUp value={result.earnedXp} /> XP
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {result.xpBreakdown.map((item) => (
                <li key={item.reason}>
                  {item.label} : +{item.xp} XP
                </li>
              ))}
              {result.xpBreakdown.length === 0 && <li>Plafond d&apos;XP du jour atteint.</li>}
            </ul>
          </>
        )}
      </div>

      <dl className={cn("grid grid-cols-2 gap-3 delay-300", appear)}>
        <div className="rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden /> Durée
          </dt>
          <dd className="mt-1 text-xl font-semibold">{formatMinutes(result.durationMinutes)}</dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-orange-500" aria-hidden /> Série
          </dt>
          <dd className="mt-1 text-xl font-semibold">
            {streak.currentDays} jour{streak.currentDays > 1 ? "s" : ""}
          </dd>
          <dd className="text-xs text-muted-foreground">
            {streak.todayValidated
              ? "Jour validé"
              : `Encore ${10 - streak.todayMinutes} min pour valider le jour`}
          </dd>
        </div>
      </dl>

      <div className={cn("space-y-2 rounded-lg border p-4 delay-500", appear)}>
        {result.leveledUp && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300"
          >
            <Sparkles className="size-4" aria-hidden /> Nouveau niveau : {level.current.name} !
          </p>
        )}
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Niveau {level.current.number} · {level.current.name}
          </span>
          <span className="text-muted-foreground">
            {level.next && level.xpUntilNextLevel !== null
              ? `${level.xpUntilNextLevel} XP avant ${level.next.name}`
              : "Niveau max"}
          </span>
        </div>
        <ProgressBar value={percent} label="Progression du niveau" barClassName="bg-violet-500" />
        <p className="text-xs text-muted-foreground">
          Objectif du jour :{" "}
          {result.dailyGoalCompleted ? "atteint" : `${streak.todayMinutes} / ${streak.dailyGoalMinutes} min`}
        </p>
      </div>

      <p className={cn("text-center text-sm text-muted-foreground delay-700", appear)}>
        {result.postCreated
          ? "Cette séance est publiée dans le fil de tes amis."
          : "Cette séance n'a pas été publiée dans le fil de tes amis."}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/focus">Nouvelle séance</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/social">Voir le fil</Link>
        </Button>
      </div>
    </div>
  );
}
