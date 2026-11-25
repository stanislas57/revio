"use client";

import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { CountUp } from "@/modules/focus/components/count-up";
import { RegularityHeatmap } from "@/modules/focus/components/stats/heatmap";
import { formatMinutes } from "@/modules/focus/domain/format";
import { AchievementIcon } from "@/modules/gamification/components/achievement-icon";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import { StreakCard } from "@/modules/gamification/components/streak-card";
import { achievementState, progressPercent, stateLabel } from "@/modules/gamification/domain/achievements";
import { cn } from "@/lib/utils";
import {
  DEMO_DAILY,
  DEMO_FRIENDS_LIVE,
  DEMO_GOALS,
  DEMO_LEVEL,
  DEMO_STREAK,
  DEMO_STREAK_DAY_LIST,
  DEMO_TODAY,
  DEMO_TROPHIES,
  DEMO_WEEK_MINUTES,
  DEMO_XP,
} from "../demo-data";

const nf = new Intl.NumberFormat("fr-FR");

/** True one frame after mount, so a bar or a ring can animate from empty to its value. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

export function XpView() {
  const mounted = useMounted();
  const percent = Math.floor(DEMO_LEVEL.progress * 100);
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Niveau {DEMO_LEVEL.current.number} · {DEMO_LEVEL.current.name}
        </p>
        <p className="landing-display text-6xl">
          <CountUp value={DEMO_XP} /> <span className="text-3xl text-muted-foreground">XP</span>
        </p>
        <ProgressBar
          value={mounted ? percent : 0}
          label={`Progression vers ${DEMO_LEVEL.next?.name}`}
          className="h-3"
          barClassName="bg-brand"
        />
        <p className="text-sm text-muted-foreground">
          {percent} % du niveau {DEMO_LEVEL.current.name} : il manque{" "}
          {nf.format(DEMO_LEVEL.xpUntilNextLevel ?? 0)} XP pour atteindre {DEMO_LEVEL.next?.name}.
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Les 8 niveaux</h3>
        <LevelLadder currentLevel={DEMO_LEVEL.current.number} />
        <p className="text-xs text-muted-foreground">Seuils provisoires, susceptibles d&apos;évoluer.</p>
      </div>
    </div>
  );
}

export function StreakView() {
  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <StreakCard streak={DEMO_STREAK} days={DEMO_STREAK_DAY_LIST} today={DEMO_TODAY} />
      </div>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Record</p>
          <p className="text-xl font-semibold">{DEMO_STREAK.recordDays} jours</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Palier suivant</p>
          <p className="text-xl font-semibold">{DEMO_STREAK.nextMilestone} jours</p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Un jour compte à partir de</p>
          <p className="text-xl font-semibold">10 min</p>
        </li>
      </ul>
      <p className="rounded-xl border bg-brand-soft p-4 text-sm text-brand-soft-foreground">
        Un jour de repos ne t&apos;enlève jamais ton record : seule la série en cours repart de zéro. Prends
        le temps qu&apos;il te faut, la régularité compte plus que la durée.
      </p>
    </div>
  );
}

export function TrophiesView() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {DEMO_TROPHIES.map(({ achievement }) => {
        const state = achievementState(achievement);
        const percent = progressPercent(achievement);
        return (
          <li
            key={achievement.id}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-card p-4",
              state === "unlocked" && "border-brand/50 bg-brand-soft",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-11 items-center justify-center rounded-lg",
                state === "unlocked" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {state === "locked" ? (
                <Lock className="size-5" />
              ) : (
                <AchievementIcon achievement={achievement} className="size-5" />
              )}
            </span>
            <div className="space-y-1">
              <p className="font-semibold">{achievement.name}</p>
              <p
                className={cn(
                  "text-sm",
                  state === "unlocked" ? "text-brand-soft-foreground" : "text-muted-foreground",
                )}
              >
                {achievement.description}
              </p>
            </div>
            <p className="mt-auto flex items-center gap-1.5 text-sm font-medium">
              {state === "unlocked" && <Check className="size-4 text-brand-text" aria-hidden />}
              {state === "locked" && <Lock className="size-4" aria-hidden />}
              {stateLabel(state)}
            </p>
            {state === "in_progress" && percent !== null && (
              <ProgressBar
                value={percent}
                label={`Progression : ${achievement.name}`}
                barClassName="bg-brand"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Ring({
  percent,
  title,
  value,
  caption,
}: {
  percent: number;
  title: string;
  value: string;
  caption: string;
}) {
  const mounted = useMounted();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const shown = Math.min(100, percent);
  return (
    <figure className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6">
      <div role="img" aria-label={`${title} : ${shown} %. ${caption}`} className="relative size-36">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="12" className="stroke-muted" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-brand transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? circumference * (1 - shown / 100) : circumference}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
          {value}
        </span>
      </div>
      <figcaption className="text-center">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{caption}</span>
      </figcaption>
    </figure>
  );
}

export function GoalsView() {
  const { daily, weekly } = DEMO_GOALS;
  const weeklyPercent = Math.round((weekly.doneMinutes / weekly.targetMinutes) * 100);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Ring
          percent={100}
          title="Objectif du jour"
          value="100 %"
          caption={`${daily.doneMinutes} min sur ${daily.targetMinutes} : atteint`}
        />
        <Ring
          percent={weeklyPercent}
          title="Objectif de la semaine"
          value={`${weeklyPercent} %`}
          caption={`${formatMinutes(weekly.doneMinutes)} sur ${formatMinutes(weekly.targetMinutes)}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        L&apos;objectif du jour existe dans Revio ; l&apos;objectif de la semaine est un exemple de ce qui est
        envisagé.
      </p>
    </div>
  );
}

export function FriendsView() {
  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-xl border bg-card">
        {DEMO_FRIENDS_LIVE.map((friend) => (
          <li key={friend.name} className="flex items-center gap-3 p-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground"
            >
              {friend.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{friend.name}</span>
              <span className="block text-sm text-muted-foreground">
                {friend.subject ?? "Matière non partagée"}
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm tabular-nums">
              <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
              {friend.minutes} min
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Chacun choisit s&apos;il montre sa matière : sans ce choix, tes amis voient seulement que tu révises.
        Jamais tes notes.
      </p>
    </div>
  );
}

export function StatsView() {
  const month = DEMO_DAILY.reduce((sum, d) => sum + d.minutes, 0);
  const today = DEMO_DAILY.at(-1)!.minutes;
  const tiles = [
    { label: "Cette semaine", value: formatMinutes(DEMO_WEEK_MINUTES) },
    { label: "Aujourd'hui", value: formatMinutes(today) },
    { label: "30 derniers jours", value: formatMinutes(month) },
    { label: "Série en cours", value: `${DEMO_STREAK.currentDays} jours` },
  ];
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">{t.value}</dd>
          </div>
        ))}
      </dl>
      <RegularityHeatmap daily={DEMO_DAILY} />
    </div>
  );
}

export const DEMO_VIEWS = {
  "progression-xp": { title: "XP et niveau", Body: XpView },
  serie: { title: "Série", Body: StreakView },
  trophees: { title: "Trophées", Body: TrophiesView },
  objectifs: { title: "Objectifs", Body: GoalsView },
  amis: { title: "Amis en révision", Body: FriendsView },
  stats: { title: "Statistiques", Body: StatsView },
} as const;
