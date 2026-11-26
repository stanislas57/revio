"use client";

import { useEffect, useState } from "react";
import { Check, Flame, HandHeart, Minus, Plus, RotateCcw } from "lucide-react";
import { formatAverage } from "@/modules/academic/domain/format";
import { overallAverage, type SubjectInput } from "@/modules/academic/domain/weighted-average";
import { levelProgress } from "@/modules/gamification/domain/levels";
import { XP_RULES } from "@/modules/gamification/domain/xp";
import { cn } from "@/lib/utils";
import { DEMO_FRIENDS_LIVE, DEMO_STREAK_DAYS, DEMO_XP } from "../demo-data";
import { usePrefersReducedMotion } from "./use-in-view-once";

/**
 * Small interactive demos of the four pillars. Invented data (the caller shows a MockBadge); the averages, the
 * levels and the XP come from the real engine (`academic/domain`, `gamification/domain`), so the demos cannot
 * drift from the product. Every control is a real button of at least 44 px; nothing moves continuously.
 */

const nf = new Intl.NumberFormat("fr-FR");
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none disabled:opacity-60";

// ---- Notes: simulate the next grade in one subject -------------------------------------------------------

const SUBJECTS = [
  { id: "stats", name: "Statistiques", grade: 15, coef: 3 },
  { id: "droit", name: "Droit", grade: 11, coef: 2 },
  { id: "marketing", name: "Marketing", grade: 13.5, coef: 3 },
  { id: "anglais", name: "Anglais", grade: 16, coef: 1 },
] as const;

function averageWith(next: number | null): number {
  const subjects: SubjectInput[] = SUBJECTS.map((s) => ({
    id: s.id,
    coefficient: s.coef,
    grades: s.id === "droit" && next !== null ? [{ value: s.grade }, { value: next }] : [{ value: s.grade }],
  }));
  return overallAverage(subjects)!;
}

const DEMO_BASE_AVERAGE = averageWith(null);

/** "Et si j'avais 14 en Droit ?" : the next grade moves the overall average (Revio convention). */
export function GradeSimulator({ initialNext = 14 }: { initialNext?: number }) {
  const [next, setNext] = useState(initialNext);
  const average = averageWith(next);
  const delta = average - DEMO_BASE_AVERAGE;
  const droitAverage = (SUBJECTS[1].grade + next) / 2;
  return (
    <div className="@container space-y-3">
      <ul className="grid grid-cols-2 gap-2 text-xs @lg:grid-cols-4">
        {SUBJECTS.map((s) => (
          <li key={s.id} className="rounded-md border bg-card px-2.5 py-2">
            <span className="block font-semibold text-foreground">{s.name}</span>
            <span className="text-muted-foreground">
              {s.grade.toString().replace(".", ",")}/20 · coef {s.coef}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3">
        <span className="text-sm font-medium" id="grade-sim-label">
          Prochaine note en Droit
        </span>
        <div className="flex items-center gap-1" role="group" aria-labelledby="grade-sim-label">
          <button
            type="button"
            className={cn(button, "size-11 border bg-card px-0")}
            onClick={() => setNext((n) => Math.max(0, n - 1))}
            disabled={next <= 0}
            aria-label="Baisser la note d'un point"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-14 text-center text-lg font-extrabold tabular-nums">{next}/20</span>
          <button
            type="button"
            className={cn(button, "size-11 border bg-card px-0")}
            onClick={() => setNext((n) => Math.min(20, n + 1))}
            disabled={next >= 20}
            aria-label="Monter la note d'un point"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div aria-hidden className="flex h-44 gap-3 rounded-lg border bg-card p-3">
        {SUBJECTS.map((s) => {
          const value = s.id === "droit" ? droitAverage : s.grade;
          return (
            <div key={s.id} className="flex h-full flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold tabular-nums">{formatAverage(value)}</span>
              {/* The track is the /20 scale: the bar height is the average, nothing else shares it. */}
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-[height] duration-300 motion-reduce:transition-none",
                    s.id === "droit" ? "bg-ring" : "bg-chart-2",
                  )}
                  style={{ height: `${(value / 20) * 100}%` }}
                />
              </div>
              <span className="text-[0.7rem] text-muted-foreground">{s.name}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm" aria-live="polite">
        Moyenne générale : <strong className="tabular-nums">{formatAverage(DEMO_BASE_AVERAGE)}</strong> →{" "}
        <strong className="text-lg tabular-nums">{formatAverage(average)}</strong>{" "}
        <span className={cn("font-semibold", delta >= 0 ? "text-revio-success-text" : "text-destructive")}>
          ({delta >= 0 ? "+" : "−"}
          {formatAverage(Math.abs(delta))})
        </span>
        <span className="block text-muted-foreground">
          Droit passe à {formatAverage(droitAverage)} : c&apos;est la matière à travailler en priorité.
        </span>
      </p>
    </div>
  );
}

// ---- Organiser: tick the sessions of the week --------------------------------------------------------------

const WEEK = [
  { day: "Lun", slot: "18 h · Statistiques", min: 45 },
  { day: "Mer", slot: "17 h 30 · Droit", min: 60 },
  { day: "Ven", slot: "14 h · Marketing", min: 30 },
] as const;

export function PlanDemo({ initialDone = 1 }: { initialDone?: number }) {
  const [done, setDone] = useState<boolean[]>(WEEK.map((_, i) => i < initialDone));
  const count = done.filter(Boolean).length;
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {WEEK.map((w, i) => (
          <li key={w.day}>
            <button
              type="button"
              aria-pressed={done[i]}
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                done[i] && "border-brand bg-brand-soft text-brand-soft-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  done[i] ? "border-brand bg-brand text-brand-foreground" : "border-input",
                )}
              >
                {done[i] && <Check className="size-3.5" />}
              </span>
              <span className="w-9 font-semibold">{w.day}</span>
              <span className="flex-1">{w.slot}</span>
              <span className={done[i] ? "" : "text-muted-foreground"}>{w.min} min</span>
              <span className="sr-only">{done[i] ? ", faite" : ", à faire"}</span>
            </button>
          </li>
        ))}
      </ul>
      <div
        role="progressbar"
        aria-label="Séances de la semaine faites"
        aria-valuemin={0}
        aria-valuemax={WEEK.length}
        aria-valuenow={count}
        aria-valuetext={`${count} sur ${WEEK.length}`}
        className="h-2 overflow-hidden rounded-pill bg-revio-primary-light"
      >
        <div
          className="h-full rounded-pill bg-ring transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(count / WEEK.length) * 100}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {count} séance{count > 1 ? "s" : ""} sur {WEEK.length} cette semaine
      </p>
    </div>
  );
}

// ---- Friends: who is studying now, and a bravo (one per friend, no counter) --------------------------------

export function FriendsDemo({ studyingNow }: { studyingNow?: ReadonlySet<string> }) {
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  const friends = DEMO_FRIENDS_LIVE.slice(0, 3);
  return (
    <ul className="space-y-2">
      {friends.map((f) => {
        const live = studyingNow ? studyingNow.has(f.name) : true;
        const isSent = sent.has(f.name);
        return (
          <li
            key={f.name}
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2.5 text-sm"
          >
            <span
              aria-hidden
              className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-soft-foreground"
            >
              {f.name.slice(0, 2).toUpperCase()}
              {live && (
                <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-revio-success" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{f.name}</span>
              <span className="block text-xs text-muted-foreground">
                {live
                  ? `En révision · ${f.subject ?? "matière non partagée"} · ${f.minutes} min`
                  : "Pas en révision"}
              </span>
            </span>
            <button
              type="button"
              disabled={isSent}
              onClick={() => setSent((s) => new Set(s).add(f.name))}
              className={cn(
                button,
                "rounded-pill px-3",
                isSent
                  ? "border border-revio-social-text text-revio-social-text disabled:opacity-100"
                  : "bg-revio-social text-revio-midnight hover:opacity-90",
              )}
            >
              <HandHeart className="size-4" aria-hidden />
              {isSent ? "Envoyé" : "Bravo"}
              <span className="sr-only"> à {f.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ---- Motivation: finish a session, win XP, climb a level -------------------------------------------------

const SESSION_MINUTES = 25;
const SESSION_XP = SESSION_MINUTES * XP_RULES.xpPerMinute;

/** Level bar of the engine; the XP won here is drawn in lime (the only lime of the demos). */
export function XpDemo({
  startXp = DEMO_XP,
  climbFrom,
  active = true,
}: {
  startXp?: number;
  /** The figure starts here and climbs to `startXp` once `active` is true (e.g. when the tile comes into view). */
  climbFrom?: number;
  active?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const [xp, setXp] = useState(startXp);
  const [shown, setShown] = useState(climbFrom ?? startXp);
  const [lastGain, setLastGain] = useState(0);
  const level = levelProgress(xp);
  const startLevel = levelProgress(startXp);
  const percent = Math.floor(level.progress * 100);

  // The figure climbs once to its value (a count-up of about one second); with reduced motion it is shown at once.
  const display = reduced ? xp : shown;
  useEffect(() => {
    if (reduced || !active || shown === xp) return;
    const step = Math.max(1, Math.ceil(Math.abs(xp - shown) / 30));
    const id = window.setTimeout(() => setShown((v) => (v < xp ? Math.min(xp, v + step) : xp)), 30);
    return () => window.clearTimeout(id);
  }, [active, reduced, shown, xp]);

  const levelledUp = level.current.number > startLevel.current.number;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold">{level.current.name}</span>
          <span className="text-muted-foreground"> · niveau {level.current.number}</span>
        </p>
        <p className="font-heading text-2xl font-extrabold tabular-nums" aria-hidden>
          {nf.format(display)} XP
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={level.next ? `Progression vers ${level.next.name}` : "Niveau maximum"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-3 overflow-hidden rounded-pill bg-revio-primary-light"
      >
        <div
          className="h-full rounded-pill bg-ring transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {nf.format(xp)} XP.{" "}
        {level.next && level.xpUntilNextLevel !== null
          ? `Encore ${nf.format(level.xpUntilNextLevel)} XP avant ${level.next.name}.`
          : "Niveau maximum."}
        {lastGain > 0 && ` Dernière séance : +${lastGain} XP.`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cn(button, "bg-primary text-primary-foreground hover:bg-revio-primary-hover")}
          onClick={() => {
            setXp((v) => v + SESSION_XP);
            setLastGain(SESSION_XP);
          }}
        >
          Terminer une séance de {SESSION_MINUTES} min
        </button>
        {lastGain > 0 && (
          <span
            key={xp}
            className="pillar-pop rounded-pill bg-revio-lime px-2.5 py-1 text-xs font-bold text-revio-midnight"
          >
            +{lastGain} XP
          </span>
        )}
        {levelledUp && (
          <span className="rounded-pill bg-revio-lime px-2.5 py-1 text-xs font-bold text-revio-midnight">
            Niveau {level.current.name} atteint !
          </span>
        )}
        {xp !== startXp && (
          <button
            type="button"
            className={cn(button, "border bg-card")}
            onClick={() => {
              setXp(startXp);
              setShown(startXp);
              setLastGain(0);
            }}
          >
            <RotateCcw className="size-4" aria-hidden /> Recommencer
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Streak: the seven days of the week, today to validate ---------------------------------------------------

const DAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

/**
 * The streak: six days already validated, today to validate (a day counts from 10 minutes). `litDays` lets a
 * caller light the past days one by one; it defaults to all six.
 */
export function StreakDemo({ litDays = 6 }: { litDays?: number }) {
  const [today, setToday] = useState(false);
  const days = DEMO_STREAK_DAYS - 1 + (today ? 1 : 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-lg bg-revio-streak text-revio-midnight"
        >
          <Flame className="size-6" />
        </span>
        <p aria-live="polite">
          <span className="font-heading text-2xl font-extrabold tabular-nums">{days} jours</span>
          <span className="block text-xs text-muted-foreground">de série</span>
        </p>
      </div>
      <ul className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((d, i) => {
          const isToday = i === 6;
          const lit = isToday ? today : i < litDays;
          return (
            <li
              key={DAY_NAMES[i]}
              aria-label={`${DAY_NAMES[i]} : ${lit ? "validé" : isToday ? "aujourd'hui, à valider" : "pas encore"}`}
              className="flex flex-col items-center gap-1"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none",
                  lit ? "bg-revio-streak text-revio-midnight" : "bg-muted",
                  isToday && !lit && "border-2 border-dashed border-revio-streak-text bg-transparent",
                )}
              >
                {lit && <Check className="size-3.5" />}
              </span>
              <span aria-hidden className={cn("text-xs", isToday ? "font-bold" : "text-muted-foreground")}>
                {d}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={today}
        onClick={() => setToday(true)}
        className={cn(button, "w-full border bg-card")}
      >
        {today ? "Aujourd'hui validé" : `Valider aujourd'hui (${XP_RULES.streakDayMinutes} min de révision)`}
      </button>
    </div>
  );
}
