/** Pure time helpers for Focus. The server clock is the source of truth. */

export type SessionClock = {
  startedAt: string | Date;
  pausedSeconds: number;
  pausedAt: string | Date | null;
};

/** Effective (non-paused) seconds elapsed at `now`. Never negative. */
export function elapsedSeconds(clock: SessionClock, now: Date | number = Date.now()): number {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const start = new Date(clock.startedAt).getTime();
  const end = clock.pausedAt ? new Date(clock.pausedAt).getTime() : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000) - clock.pausedSeconds);
}

/** "05:07", "1:02:03". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** "45 min", "1 h", "1 h 20". */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${String(rest).padStart(2, "0")}`;
}
