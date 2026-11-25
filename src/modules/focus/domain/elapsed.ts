/**
 * Elapsed time of a session, computed from server timestamps (never from a
 * JavaScript counter alone). Pure: usable from client components.
 */

import type { ActiveSession } from "../contracts";

type Timing = Pick<ActiveSession, "startedAt" | "pausedAt" | "pausedSeconds">;

/** Seconds of actual study at `nowMs` (pauses excluded), never negative. */
export function elapsedSeconds(session: Timing, nowMs: number): number {
  const start = Date.parse(session.startedAt);
  if (Number.isNaN(start)) throw new RangeError("Date de début invalide.");
  const end = session.pausedAt ? Date.parse(session.pausedAt) : nowMs;
  if (Number.isNaN(end)) throw new RangeError("Date de pause invalide.");
  const seconds = Math.floor((end - start) / 1000) - session.pausedSeconds;
  return Math.max(0, seconds);
}

/** Difference between the server clock and the local clock, in ms. */
export function clockOffsetMs(serverNow: string, localNowMs: number): number {
  const server = Date.parse(serverNow);
  return Number.isNaN(server) ? 0 : server - localNowMs;
}

/** "mm:ss", or "h:mm:ss" from one hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
