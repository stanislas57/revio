/** Calendar arithmetic on ISO dates (YYYY-MM-DD). Time-zone free: works on whole days only. */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function toUtc(iso: string): number {
  if (!ISO_DATE.test(iso)) throw new RangeError(`Date invalide : ${iso}`);
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const time = Date.UTC(y, m - 1, d);
  const check = new Date(time);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`Date invalide : ${iso}`);
  }
  return time;
}

function fromUtc(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  try {
    toUtc(value);
    return true;
  } catch {
    return false;
  }
}

export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * DAY_MS);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(iso: string): number {
  return (new Date(toUtc(iso)).getUTCDay() + 6) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: string, months: number): string {
  const [y, m] = iso.split("-").map(Number) as [number, number];
  const index = y * 12 + (m - 1) + months;
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  const day = Number(iso.slice(8, 10));
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

const fmt = (options: Intl.DateTimeFormatOptions, iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" }).format(new Date(toUtc(iso)));

/** "jeudi 3 décembre 2026" */
export const formatLongDate = (iso: string) =>
  fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, iso);
/** "décembre 2026" */
export const formatMonth = (iso: string) => fmt({ month: "long", year: "numeric" }, iso);
/** "lun." */
export const formatWeekdayShort = (iso: string) => fmt({ weekday: "short" }, iso);
/** "3 déc." */
export const formatDayMonth = (iso: string) => fmt({ day: "numeric", month: "short" }, iso);
