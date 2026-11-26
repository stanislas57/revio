import { describe, expect, it } from "vitest";
import { eventSchema } from "../schemas";
import {
  buildQuickResult,
  DURATIONS,
  endTime,
  quickTitle,
  resolveDay,
  SLOT_HOURS,
  type QuickAnswers,
} from "./quick-add";

const base: QuickAnswers = {
  type: "revision",
  subject: { id: "7f1c2b0e-4a3d-4c66-9d6e-0a1b2c3d4e5f", name: "Droit" },
  other: null,
  day: "tomorrow",
  hour: 18,
  minutes: 45,
};

describe("resolveDay (2026-11-26 is a Thursday)", () => {
  it("resolves each button", () => {
    expect(resolveDay("today", "2026-11-26")).toBe("2026-11-26");
    expect(resolveDay("tomorrow", "2026-11-26")).toBe("2026-11-27");
    expect(resolveDay("after", "2026-11-26")).toBe("2026-11-28");
    expect(resolveDay("weekend", "2026-11-26")).toBe("2026-11-28"); // Saturday
    expect(resolveDay("next-week", "2026-11-26")).toBe("2026-11-30"); // Monday
  });

  it("keeps today for « Ce week-end » on a weekend and goes to the next Monday from a Sunday", () => {
    expect(resolveDay("weekend", "2026-11-28")).toBe("2026-11-28");
    expect(resolveDay("weekend", "2026-11-29")).toBe("2026-11-29");
    expect(resolveDay("next-week", "2026-11-29")).toBe("2026-11-30");
    expect(resolveDay("next-week", "2026-11-30")).toBe("2026-12-07");
  });
});

describe("endTime", () => {
  it("adds the duration and refuses to pass midnight", () => {
    expect(endTime("18:00", 45)).toBe("18:45");
    expect(endTime("20:00", 120)).toBe("22:00");
    expect(endTime("23:00", 60)).toBeNull();
  });

  it("every hour button with every duration stays on the same day", () => {
    for (const h of SLOT_HOURS)
      for (const d of DURATIONS) expect(endTime(`${h}:00`, d.minutes)).not.toBeNull();
  });
});

describe("buildQuickResult", () => {
  it("builds a revision that the real event schema accepts", () => {
    const r = buildQuickResult(base, "2026-11-26");
    expect(r?.kind).toBe("event");
    if (r?.kind !== "event") return;
    expect(r.input).toMatchObject({
      title: "Révision · Droit",
      kind: "study",
      startsOn: "2026-11-27",
      startTime: "18:00",
      endTime: "18:45",
    });
    expect(eventSchema.safeParse(r.input).success).toBe(true);
  });

  it("maps each type to its database kind", () => {
    const kinds = (["revision", "cours", "devoir", "projet", "pause"] as const).map((type) => {
      const r = buildQuickResult({ ...base, type }, "2026-11-26");
      return r?.kind === "event" ? r.input.kind : null;
    });
    expect(kinds).toEqual(["study", "class", "other", "other", "unavailable"]);
  });

  it("uses an « Autre » label when no subject is chosen, and needs one of the two", () => {
    const other = buildQuickResult({ ...base, subject: null, other: "Lecture" }, "2026-11-26");
    expect(other?.kind === "event" && other.input.title).toBe("Révision · Lecture");
    expect(other?.kind === "event" && other.input.subjectId).toBeNull();
    expect(buildQuickResult({ ...base, subject: null }, "2026-11-26")).toBeNull();
  });

  it("asks no subject for a break", () => {
    const r = buildQuickResult({ ...base, type: "pause", subject: null }, "2026-11-26");
    expect(r?.kind === "event" && r.input.title).toBe("Pause");
  });

  it("makes an exam of a whole day, without time or duration", () => {
    const r = buildQuickResult({ ...base, type: "examen", hour: null, minutes: null }, "2026-11-26");
    expect(r).toEqual({
      kind: "exam",
      input: { title: "Examen · Droit", subjectId: base.subject!.id, examOn: "2026-11-27" },
    });
  });

  it("is null while the time or the duration is missing, or if it would pass midnight", () => {
    expect(buildQuickResult({ ...base, hour: null }, "2026-11-26")).toBeNull();
    expect(buildQuickResult({ ...base, minutes: null }, "2026-11-26")).toBeNull();
  });

  it("titles", () => {
    expect(quickTitle({ type: "cours", subject: null, other: null })).toBe("Cours");
  });
});
