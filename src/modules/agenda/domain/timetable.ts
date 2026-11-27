/** Pure helpers of the timetable views (week grid, day timeline): positions, durations, "now". */

import { eachDay } from "./dates";
import type { AgendaItem } from "./types";

/** "HH:MM" → minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

/** "HH:MM" of minutes since midnight. */
export function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** 90 → "1 h 30", 120 → "2 h", 45 → "45 min", 0 → "0 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Duration of a timed item in minutes, 0 for an all-day item. */
export function durationMinutes(item: Pick<AgendaItem, "startTime" | "endTime">): number {
  if (item.startTime === null || item.endTime === null) return 0;
  return Math.max(0, toMinutes(item.endTime) - toMinutes(item.startTime));
}

/** The current date and time of day in a time zone (wall clock, like the rest of the agenda). */
export function localNow(timeZone: string, now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export const DEFAULT_FIRST_HOUR = 8;
export const DEFAULT_LAST_HOUR = 19;

/** The hours the week grid shows: 8 h to 19 h, widened when an item starts earlier or ends later (0 to 24). */
export function hourBounds(days: Iterable<AgendaItem[]>): { first: number; last: number } {
  let first = DEFAULT_FIRST_HOUR;
  let last = DEFAULT_LAST_HOUR;
  for (const items of days) {
    for (const item of items) {
      if (item.startTime === null || item.endTime === null) continue;
      first = Math.min(first, Math.floor(toMinutes(item.startTime) / 60));
      last = Math.max(last, Math.ceil(toMinutes(item.endTime) / 60));
    }
  }
  return { first: Math.max(0, first), last: Math.min(24, last) };
}

export type Block = {
  item: AgendaItem;
  start: number;
  end: number;
  /** Column among the items that overlap in time (0-based) and how many columns the group needs. */
  lane: number;
  lanes: number;
};

/** Timed items of one day with their side-by-side columns when they overlap. All-day items are left out. */
export function layoutBlocks(items: AgendaItem[]): Block[] {
  const timed = items
    .filter((i) => i.startTime !== null && i.endTime !== null && durationMinutes(i) > 0)
    .map((item) => ({ item, start: toMinutes(item.startTime!), end: toMinutes(item.endTime!) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const blocks: Block[] = [];
  let group: Block[] = [];
  let groupEnd = -1;
  const flush = () => {
    const lanes = group.reduce((max, b) => Math.max(max, b.lane + 1), 1);
    for (const b of group) b.lanes = lanes;
    blocks.push(...group);
    group = [];
  };

  for (const entry of timed) {
    if (group.length > 0 && entry.start >= groupEnd) flush();
    const used = new Set(group.filter((b) => b.end > entry.start).map((b) => b.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    group.push({ ...entry, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, entry.end);
  }
  flush();
  return blocks;
}

export type WeekSummary = { classMinutes: number; classCount: number; studyMinutes: number; exams: number };

/** Totals of the days between `from` and `to` (those present in `byDay`). */
export function summarize(byDay: Map<string, AgendaItem[]>, from: string, to: string): WeekSummary {
  const total: WeekSummary = { classMinutes: 0, classCount: 0, studyMinutes: 0, exams: 0 };
  for (const day of eachDay(from, to)) {
    for (const item of byDay.get(day) ?? []) {
      if (item.kind === "class") {
        total.classMinutes += durationMinutes(item);
        total.classCount += 1;
      } else if (item.kind === "study") total.studyMinutes += durationMinutes(item);
      else if (item.kind === "exam") total.exams += 1;
    }
  }
  return total;
}

export type ItemState = "past" | "current" | "future";

/** Where an item stands compared with now: used by the day timeline (done, in progress, later). */
export function itemState(
  item: Pick<AgendaItem, "date" | "startTime" | "endTime">,
  today: string,
  nowMinutes: number,
): ItemState {
  if (item.date < today) return "past";
  if (item.date > today) return "future";
  if (item.startTime === null || item.endTime === null) return "future";
  if (toMinutes(item.endTime) <= nowMinutes) return "past";
  return toMinutes(item.startTime) <= nowMinutes ? "current" : "future";
}

/** Progress (0 to 100) of the item in progress, and the minutes left. */
export function progress(item: { startTime: string; endTime: string }, nowMinutes: number) {
  const start = toMinutes(item.startTime);
  const end = toMinutes(item.endTime);
  const done = Math.min(Math.max(nowMinutes - start, 0), end - start);
  return {
    percent: Math.round((done / Math.max(end - start, 1)) * 100),
    minutesLeft: Math.max(end - nowMinutes, 0),
  };
}

/** "J-10" style countdown to a day, "Aujourd'hui" and "Demain" included. */
export function countdownLabel(days: number): string {
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `J-${days}`;
}
