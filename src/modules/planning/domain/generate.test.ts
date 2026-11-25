import { describe, expect, it } from "vitest";
import type { AgendaItem } from "@/modules/agenda/domain/types";
import { generatePlan, toMinutes, type PlanInput, type PlanSubject } from "./generate";

const subj = (id: string, score: number, extra: Partial<PlanSubject> = {}): PlanSubject => ({
  id,
  name: id,
  score,
  reason: `why ${id}`,
  examOn: null,
  ...extra,
});

function item(p: Partial<AgendaItem> & { date: string }): AgendaItem {
  return {
    key: `event:${Math.random()}`,
    source: "event",
    id: "x",
    title: "x",
    kind: "class",
    subjectId: null,
    startTime: "09:00",
    endTime: "10:00",
    recurring: false,
    planStatus: null,
    planReason: null,
    ...p,
  };
}

const week = (items: AgendaItem[] = []): PlanInput["days"] =>
  ["2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11", "2026-12-12", "2026-12-13"].map(
    (date) => ({ date, items: items.filter((i) => i.date === date) }),
  );

const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  days: week(),
  subjects: [subj("maths", 3), subj("droit", 1)],
  nowMinutes: 0,
  today: "2026-12-07",
  ...over,
});

const overlap = (a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) =>
  toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);

describe("generatePlan", () => {
  it("is deterministic and proposes at most maxSessions", () => {
    const a = generatePlan(base());
    expect(a).toEqual(generatePlan(base()));
    expect(a).toHaveLength(8);
  });

  it("serves subjects in proportion to their score", () => {
    const plan = generatePlan(base());
    const count = (id: string) => plan.filter((p) => p.subjectId === id).length;
    expect(count("maths")).toBeGreaterThan(count("droit"));
    expect(count("droit")).toBeGreaterThan(0);
  });

  it("gives nothing to a subject with score 0 and nothing without priorities", () => {
    expect(generatePlan(base({ subjects: [subj("option", 0)] }))).toEqual([]);
    const plan = generatePlan(base({ subjects: [subj("maths", 2), subj("option", 0)] }));
    expect(plan.every((p) => p.subjectId === "maths")).toBe(true);
  });

  it("never overlaps timed items nor leaves the study window", () => {
    const items = week().flatMap((d) => [
      item({ date: d.date, startTime: "08:00", endTime: "12:00" }),
      item({ date: d.date, startTime: "14:00", endTime: "16:30", kind: "unavailable" }),
    ]);
    const plan = generatePlan(base({ days: week(items) }));
    expect(plan.length).toBeGreaterThan(0);
    for (const slot of plan) {
      expect(toMinutes(slot.startTime)).toBeGreaterThanOrEqual(8 * 60);
      expect(toMinutes(slot.endTime)).toBeLessThanOrEqual(21 * 60);
      for (const busy of items.filter((i) => i.date === slot.date)) {
        expect(overlap(slot, { startTime: busy.startTime!, endTime: busy.endTime! })).toBe(false);
      }
    }
  });

  it("keeps a break between revision sessions and never exceeds the daily maximum", () => {
    const plan = generatePlan(base({ days: [week()[0]!], settings: { maxSessions: 20 } }));
    const minutes = plan.reduce((n, p) => n + toMinutes(p.endTime) - toMinutes(p.startTime), 0);
    expect(minutes).toBeLessThanOrEqual(180);
    for (let i = 1; i < plan.length; i++) {
      expect(toMinutes(plan[i]!.startTime) - toMinutes(plan[i - 1]!.endTime)).toBeGreaterThanOrEqual(15);
    }
  });

  it("counts revision already in the agenda against the daily maximum", () => {
    const existing = item({ date: "2026-12-07", kind: "study", startTime: "08:00", endTime: "10:45" }); // 165 min
    const plan = generatePlan(base({ days: [{ date: "2026-12-07", items: [existing] }] }));
    expect(plan).toEqual([]); // 165 + 45 > 180
  });

  it("skips days blocked by an all-day unavailability", () => {
    const off = item({ date: "2026-12-07", kind: "unavailable", startTime: null, endTime: null });
    const plan = generatePlan(base({ days: week([off]) }));
    expect(plan.some((p) => p.date === "2026-12-07")).toBe(false);
  });

  it("does not plan in the past of today", () => {
    const plan = generatePlan(base({ nowMinutes: 17 * 60 + 10 }));
    for (const p of plan.filter((x) => x.date === "2026-12-07")) {
      expect(toMinutes(p.startTime)).toBeGreaterThanOrEqual(17 * 60 + 15);
    }
  });

  it("plans a subject with an exam strictly before the exam day", () => {
    const plan = generatePlan(
      base({ subjects: [subj("maths", 3, { examOn: "2026-12-09" })], settings: { maxSessions: 6 } }),
    );
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((p) => p.date < "2026-12-09")).toBe(true);
  });

  it("puts at most one new session per subject and per day", () => {
    const plan = generatePlan(base({ subjects: [subj("maths", 5)], settings: { maxSessions: 20 } }));
    const keys = plan.map((p) => `${p.subjectId}@${p.date}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(plan).toHaveLength(7); // one per day of the week
  });

  it("treats accepted and locked sessions as already given and does not move them", () => {
    const kept = [
      item({
        date: "2026-12-07",
        kind: "study",
        subjectId: "maths",
        planStatus: "locked",
        startTime: "09:00",
        endTime: "09:45",
      }),
      item({
        date: "2026-12-08",
        kind: "study",
        subjectId: "maths",
        planStatus: "accepted",
        startTime: "09:00",
        endTime: "09:45",
      }),
    ];
    const plan = generatePlan(base({ days: week(kept), settings: { maxSessions: 2 } }));
    // maths already has 2 sessions (weight 3/3 = 1) vs droit 1/1 = 1 → tie broken by score: maths first.
    // Whatever the choice, nothing overlaps the kept sessions and they are not part of the result.
    for (const slot of plan) {
      for (const k of kept.filter((i) => i.date === slot.date)) {
        expect(overlap(slot, { startTime: k.startTime!, endTime: k.endTime! })).toBe(false);
      }
    }
    expect(plan.some((p) => p.date === "2026-12-07" && p.startTime === "09:00")).toBe(false);
    const droit = plan.filter((p) => p.subjectId === "droit").length;
    expect(droit).toBeGreaterThan(0);
  });

  it("stops quietly when there is no room at all", () => {
    const full = week().map((d) => ({
      date: d.date,
      items: [item({ date: d.date, startTime: "08:00", endTime: "21:00" })],
    }));
    expect(generatePlan(base({ days: full }))).toEqual([]);
  });

  it("does not mutate its input", () => {
    const input = base();
    const snapshot = JSON.stringify(input);
    generatePlan(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
