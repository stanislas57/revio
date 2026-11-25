import Link from "next/link";
import { Clock, Flame, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelProgress } from "@/modules/gamification/domain/levels";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import { cn } from "@/lib/utils";
import { formatMinutes } from "../domain/time";
import type { SessionRow } from "../schemas";
import { CountUp } from "./count-up";
import { ShareToggle } from "./share-toggle";

const appear =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none";

/**
 * End-of-session recap. Every number comes from the database result
 * (complete_study_session); nothing is computed or granted here.
 */
export function SessionSummary({
  session,
  xp,
  totalXp,
  levelBeforeXp,
}: {
  session: SessionRow;
  xp: { session: number; streakBonus: number };
  totalXp: number;
  /** Total XP before this session, or null when unknown (older session). */
  levelBeforeXp: number | null;
}) {
  const earned = xp.session + xp.streakBonus;
  const level = getLevelProgress(totalXp);
  const leveledUp =
    levelBeforeXp !== null && getLevelProgress(levelBeforeXp).current.level < level.current.level;
  const minutes = session.duration_minutes ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className={cn("space-y-2 text-center", appear)}>
        <PartyPopper className="mx-auto size-10 text-violet-500" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight">Séance terminée</h1>
        <p className="text-muted-foreground">{session.label ?? "Révision"}</p>
      </div>

      <div className={cn("rounded-xl border p-6 text-center", appear, "delay-150")}>
        <p className="text-5xl font-bold text-violet-600 dark:text-violet-400">
          +<CountUp value={earned} /> XP
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>
            {minutes} min de révision : +{xp.session} XP
          </li>
          {xp.streakBonus > 0 && <li>Bonus de série : +{xp.streakBonus} XP</li>}
          {minutes === 0 && <li>Moins d&apos;une minute : pas d&apos;XP cette fois.</li>}
        </ul>
      </div>

      <dl className={cn("grid grid-cols-2 gap-3", appear, "delay-300")}>
        <div className="rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden /> Durée
          </dt>
          <dd className="mt-1 text-xl font-semibold">{formatMinutes(minutes)}</dd>
        </div>
        <div className="rounded-lg border p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-orange-500" aria-hidden /> Série
          </dt>
          <dd className="mt-1 text-xl font-semibold">
            {session.streak_days ?? 0} jour{(session.streak_days ?? 0) > 1 ? "s" : ""}
          </dd>
        </div>
      </dl>

      <div className={cn("space-y-2 rounded-lg border p-4", appear, "delay-500")}>
        {leveledUp && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-md bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300"
          >
            <Sparkles className="size-4" aria-hidden /> Nouveau niveau : {level.current.name} !
          </p>
        )}
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Niveau {level.current.level} · {level.current.name}
          </span>
          <span className="text-muted-foreground">
            {level.next ? `${level.xpRemaining} XP avant ${level.next.name}` : "Niveau max"}
          </span>
        </div>
        <ProgressBar value={level.percent} label="Progression du niveau" barClassName="bg-violet-500" />
      </div>

      <div className={cn(appear, "delay-700")}>
        <ShareToggle sessionId={session.id} shared={session.visibility === "friends"} />
      </div>

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
