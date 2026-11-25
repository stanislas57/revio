/** Calendar-day helpers on ISO dates (YYYY-MM-DD), time-zone safe. */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function toUtcDay(iso: string): number {
  if (!ISO_DATE.test(iso)) throw new RangeError(`Date invalide : ${iso}`);
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`Date invalide : ${iso}`);
  }
  return time;
}

/** Whole days from `from` to `to` (negative when `to` is in the past). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDay(to) - toUtcDay(from)) / DAY_MS);
}

/** Today's date (YYYY-MM-DD) in the given time zone (default Europe/Paris). */
export function todayIso(timeZone = "Europe/Paris", now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isIsoDate(value: string): boolean {
  try {
    toUtcDay(value);
    return true;
  } catch {
    return false;
  }
}

/** "2026-12-03" → "jeu. 3 déc." */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(toUtcDay(iso)));
}
