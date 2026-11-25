import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  GOAL_MAX_MINUTES,
  GOAL_MIN_MINUTES,
  TIMEZONE_OPTIONS,
  normalizeTimeZone,
  settingsSchema,
  timezoneChoices,
} from "./settings";

const valid = { timezone: "Europe/Paris", dailyGoalMinutes: 30, autoPost: true, shareSubjectInFeed: false };

describe("defaults (decision D-16)", () => {
  it("never shares the subject by default", () => {
    expect(DEFAULT_SETTINGS.shareSubjectInFeed).toBe(false);
  });

  it("keeps a missing sharing field private when parsing", () => {
    const parsed = settingsSchema.parse({ timezone: "Europe/Paris", dailyGoalMinutes: 30 });
    expect(parsed.shareSubjectInFeed).toBe(false);
    expect(parsed.autoPost).toBe(true);
  });

  it("only shares the subject when it is explicitly true", () => {
    expect(settingsSchema.parse({ ...valid, shareSubjectInFeed: true }).shareSubjectInFeed).toBe(true);
    expect(settingsSchema.safeParse({ ...valid, shareSubjectInFeed: "true" }).success).toBe(false);
  });

  it("starts at 30 minutes in Paris", () => {
    expect(DEFAULT_SETTINGS.dailyGoalMinutes).toBe(30);
    expect(DEFAULT_SETTINGS.timezone).toBe("Europe/Paris");
  });
});

describe("daily goal", () => {
  it("accepts the bounds 10 and 600", () => {
    expect(settingsSchema.safeParse({ ...valid, dailyGoalMinutes: GOAL_MIN_MINUTES }).success).toBe(true);
    expect(settingsSchema.safeParse({ ...valid, dailyGoalMinutes: GOAL_MAX_MINUTES }).success).toBe(true);
  });

  it("rejects 9 and 601", () => {
    expect(settingsSchema.safeParse({ ...valid, dailyGoalMinutes: 9 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...valid, dailyGoalMinutes: 601 }).success).toBe(false);
  });

  it("rejects decimals, strings, NaN and infinity", () => {
    for (const value of [30.5, "30", Number.NaN, Number.POSITIVE_INFINITY, null, undefined]) {
      expect(settingsSchema.safeParse({ ...valid, dailyGoalMinutes: value }).success).toBe(false);
    }
  });

  it("explains the problem in French", () => {
    const result = settingsSchema.safeParse({ ...valid, dailyGoalMinutes: 5 });
    expect(result.success ? "" : result.error.issues[0]?.message).toMatch(/au moins 10 minutes/);
  });
});

describe("time zone (validated on the server)", () => {
  it("accepts real IANA zones and normalises the case", () => {
    expect(settingsSchema.parse({ ...valid, timezone: "Europe/Paris" }).timezone).toBe("Europe/Paris");
    expect(settingsSchema.parse({ ...valid, timezone: "  europe/paris  " }).timezone).toBe("Europe/Paris");
    expect(settingsSchema.parse({ ...valid, timezone: "America/Argentina/Buenos_Aires" }).timezone).toBe(
      "America/Argentina/Buenos_Aires",
    );
    expect(settingsSchema.parse({ ...valid, timezone: "UTC" }).timezone).toBe("UTC");
  });

  it("rejects unknown zones, numeric offsets and junk", () => {
    for (const timezone of [
      "Mars/Phobos",
      "Europe/Paris; drop table",
      "+02:00",
      "GMT+2",
      "",
      " ",
      "Paris",
      "a/".repeat(40),
    ]) {
      expect(settingsSchema.safeParse({ ...valid, timezone }).success, timezone).toBe(false);
    }
  });

  it("rejects a non-string value", () => {
    expect(settingsSchema.safeParse({ ...valid, timezone: 42 }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...valid, timezone: null }).success).toBe(false);
  });

  it("keeps the name chosen by the user instead of rewriting it to an older alias", () => {
    expect(normalizeTimeZone("America/Montreal")).toBe("America/Montreal");
    expect(normalizeTimeZone("America/Argentina/Buenos_Aires")).toBe("America/Argentina/Buenos_Aires");
  });

  it("normalizeTimeZone returns null for unknown zones", () => {
    expect(normalizeTimeZone("Nowhere/Land")).toBeNull();
    expect(normalizeTimeZone("Europe/Paris")).toBe("Europe/Paris");
  });
});

describe("timezone options", () => {
  it("only offers zones the runtime knows, Paris first", () => {
    expect(TIMEZONE_OPTIONS[0]?.value).toBe("Europe/Paris");
    for (const option of TIMEZONE_OPTIONS)
      expect(normalizeTimeZone(option.value), option.value).toBe(option.value);
  });

  it("keeps the user's current zone selectable when it is not listed", () => {
    expect(timezoneChoices("Asia/Tokyo")[0]).toEqual({ value: "Asia/Tokyo", label: "Asia/Tokyo" });
    expect(timezoneChoices("Europe/Paris")).toHaveLength(TIMEZONE_OPTIONS.length);
  });
});
