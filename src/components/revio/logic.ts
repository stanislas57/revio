/**
 * Pure rules of the Revio components (no React, no browser): ring geometry, league ranking, quests and the
 * "once a day" guards of the anti-pressure rules. Tested in logic.test.ts.
 */

export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Geometry of a ring: the progress arc and, at its end, the recent gain (the lime segment). */
export function ringGeometry(size: number, stroke: number, value: number, gainValue = 0) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp01(value);
  // The gain is the last part of the progress: it can never be longer than the progress itself.
  const gain = Math.min(clamp01(gainValue), progress);
  const base = progress - gain;
  return {
    radius,
    circumference,
    progress,
    baseLength: base * circumference,
    gainLength: gain * circumference,
    /** The gain starts where the base ends. */
    gainOffset: -base * circumference,
    percent: Math.round(progress * 100),
  };
}

/** Local calendar day "YYYY-MM-DD" (the guards below reset at local midnight). */
export function dayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type Store = Pick<Storage, "getItem" | "setItem">;

/**
 * A celebration (confetti, level-up…) plays once per event, never in a loop: here once per day and per key.
 * `store` is injectable (tests) and every access is guarded (private mode, blocked storage).
 */
export function claimDaily(store: Store | null, key: string, today: string): boolean {
  try {
    const name = `revio:once:${key}`;
    if (!store || store.getItem(name) === today) return false;
    store.setItem(name, today);
    return true;
  } catch {
    // Without storage the celebration still plays, but only once per component lifetime (the caller keeps a flag).
    return true;
  }
}

// ---- Kudos: one encouragement per day and per friend; the count stays private --------------------------------

export type KudosLedger = Readonly<Record<string, string>>; // friend id -> day of the last kudos

export const canSendKudos = (ledger: KudosLedger, friendId: string, today: string) =>
  ledger[friendId] !== today;

export const recordKudos = (ledger: KudosLedger, friendId: string, today: string): KudosLedger => ({
  ...ledger,
  [friendId]: today,
});

// ---- Quests -----------------------------------------------------------------------------------------------

export type Quest = { id: string; label: string; xp: number; current: number; target: number };

export const questDone = (q: Pick<Quest, "current" | "target">) => q.current >= q.target;
export const questsDone = (quests: readonly Quest[]) => quests.filter(questDone).length;
export const allQuestsDone = (quests: readonly Quest[]) => quests.length > 0 && quests.every(questDone);
export const questProgress = (q: Pick<Quest, "current" | "target">) =>
  q.target <= 0 ? 1 : clamp01(q.current / q.target);

/** Completing the last quest is the only moment the chest opens: from "not all done" to "all done". */
export const chestJustOpened = (before: readonly Quest[], after: readonly Quest[]) =>
  !allQuestsDone(before) && allQuestsDone(after);

// ---- League -----------------------------------------------------------------------------------------------

export type LeagueRow = { id: string; name: string; xp: number; isMe?: boolean };
export type RankedRow = LeagueRow & { rank: number };

/** Sorted by XP (highest first), ties by name so the order never flickers. Ranks start at 1. */
export function rankLeague(rows: readonly LeagueRow[]): RankedRow[] {
  return [...rows]
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "fr"))
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export const addXp = (rows: readonly LeagueRow[], id: string, delta: number): LeagueRow[] =>
  rows.map((r) => (r.id === id ? { ...r, xp: Math.max(0, r.xp + delta) } : r));

/** Places gained between two rankings for one row (positive = moved up). */
export function placesGained(before: readonly RankedRow[], after: readonly RankedRow[], id: string): number {
  const was = before.find((r) => r.id === id)?.rank;
  const is = after.find((r) => r.id === id)?.rank;
  return was === undefined || is === undefined ? 0 : was - is;
}

// ---- Flashcards -------------------------------------------------------------------------------------------

export type Verdict = "know" | "review";

/** The stack after a verdict: the card leaves; "review" cards come back at the end, "know" cards do not. */
export function nextStack<T>(stack: readonly T[], verdict: Verdict): T[] {
  if (stack.length === 0) return [];
  const [top, ...rest] = stack;
  return verdict === "review" ? [...rest, top!] : rest;
}

// ---- Time -------------------------------------------------------------------------------------------------

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
