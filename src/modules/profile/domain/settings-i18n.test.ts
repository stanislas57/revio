import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, isLocale, parseLocale, type Locale } from "./locale";
import { settingsSchema, settingsSchemaFor, timezoneChoices, TIMEZONE_OPTIONS } from "./settings";
import { SETTINGS_MESSAGES, type SettingsMessages } from "./settings-messages";

const valid = { timezone: "Europe/Paris", dailyGoalMinutes: 30, autoPost: true, shareSubjectInFeed: false };
const others: Locale[] = ["en", "es"];

/** Every text of a dictionary, with its path: functions are called with sample numbers. */
function flatten(m: SettingsMessages): [string, string][] {
  const out: [string, string][] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "function") out.push([path, (value as (...n: number[]) => string)(10, 600)]);
    else if (typeof value === "string") out.push([path, value]);
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    }
  };
  walk(m, "");
  return out;
}

describe("locale helpers", () => {
  it("offers French, English and Spanish, French first and by default", () => {
    expect(LOCALES).toEqual(["fr", "en", "es"]);
    expect(DEFAULT_LOCALE).toBe("fr");
  });

  it("names each language in itself", () => {
    expect(LOCALE_NAMES).toEqual({ fr: "Français", en: "English", es: "Español" });
  });

  it("recognises a language and falls back to French for anything else", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(parseLocale("es")).toBe("es");
    for (const bad of [undefined, null, "", "EN", "de", "fr-FR", "<script>"]) {
      expect(parseLocale(bad as string | null | undefined), String(bad)).toBe("fr");
    }
  });
});

describe("the settings dictionary", () => {
  const fr = flatten(SETTINGS_MESSAGES.fr);

  it("has exactly the same keys in the three languages", () => {
    const keys = (m: SettingsMessages) => flatten(m).map(([k]) => k);
    expect(keys(SETTINGS_MESSAGES.en)).toEqual(keys(SETTINGS_MESSAGES.fr));
    expect(keys(SETTINGS_MESSAGES.es)).toEqual(keys(SETTINGS_MESSAGES.fr));
  });

  it("has no empty text", () => {
    for (const locale of LOCALES) {
      for (const [path, text] of flatten(SETTINGS_MESSAGES[locale])) {
        expect(text.trim().length, `${locale}.${path}`).toBeGreaterThan(0);
      }
    }
  });

  it("leaves nothing copied from French (only names that really are the same)", () => {
    const sameOnPurpose = new Set(["zones.Indian/Mayotte", "zones.America/Martinique"]);
    for (const locale of others) {
      const texts = new Map(flatten(SETTINGS_MESSAGES[locale]));
      for (const [path, french] of fr) {
        if (sameOnPurpose.has(path)) continue;
        expect(texts.get(path), `${locale}.${path}`).not.toBe(french);
      }
    }
  });

  it("labels every offered time zone in every language", () => {
    for (const locale of LOCALES) {
      for (const option of TIMEZONE_OPTIONS) {
        expect(SETTINGS_MESSAGES[locale].zones[option.value], `${locale} ${option.value}`).toBeTruthy();
      }
    }
  });

  it("states the goal range in every language", () => {
    for (const locale of LOCALES) {
      const help = SETTINGS_MESSAGES[locale].goalHelp(10, 600);
      expect(help).toContain("10");
      expect(help).toContain("600");
    }
  });

  it("keeps the promise that grades are never shared, in every language", () => {
    expect(SETTINGS_MESSAGES.fr.shareSubjectHelp).toMatch(/notes/);
    expect(SETTINGS_MESSAGES.en.shareSubjectHelp).toMatch(/grades/i);
    expect(SETTINGS_MESSAGES.es.shareSubjectHelp).toMatch(/notas/);
  });
});

describe("settingsSchemaFor", () => {
  const goalError = (locale: Locale, goal: unknown) => {
    const r = settingsSchemaFor(locale).safeParse({ ...valid, dailyGoalMinutes: goal });
    return r.success ? "" : (r.error.issues[0]?.message ?? "");
  };

  it("explains a goal under the minimum in each language", () => {
    expect(goalError("fr", 5)).toBe("L'objectif doit être d'au moins 10 minutes.");
    expect(goalError("en", 5)).toBe("The goal must be at least 10 minutes.");
    expect(goalError("es", 5)).toBe("El objetivo debe ser de al menos 10 minutos.");
  });

  it("explains a goal over the maximum in each language", () => {
    expect(goalError("fr", 601)).toMatch(/dépasser 600/);
    expect(goalError("en", 601)).toMatch(/exceed 600/);
    expect(goalError("es", 601)).toMatch(/superar los 600/);
  });

  it("explains a decimal and a non-number in each language", () => {
    expect(goalError("en", 30.5)).toMatch(/whole number/);
    expect(goalError("es", 30.5)).toMatch(/número entero/);
    expect(goalError("en", "30")).toMatch(/must be a number/);
    expect(goalError("es", Number.NaN)).toMatch(/debe ser un número/);
  });

  it("explains an unknown time zone in each language", () => {
    const zoneError = (locale: Locale) => {
      const r = settingsSchemaFor(locale).safeParse({ ...valid, timezone: "Mars/Phobos" });
      return r.success ? "" : (r.error.issues[0]?.message ?? "");
    };
    expect(zoneError("fr")).toBe("Fuseau horaire inconnu.");
    expect(zoneError("en")).toBe("Unknown time zone.");
    expect(zoneError("es")).toBe("Zona horaria desconocida.");
  });

  it("accepts and rejects exactly the same values whatever the language", () => {
    for (const goal of [9, 10, 300, 600, 601, 30.5]) {
      const results = LOCALES.map(
        (l) => settingsSchemaFor(l).safeParse({ ...valid, dailyGoalMinutes: goal }).success,
      );
      expect(new Set(results).size, `goal ${goal}`).toBe(1);
    }
  });

  it("keeps the subject private by default in every language (decision D-16)", () => {
    for (const locale of LOCALES) {
      const parsed = settingsSchemaFor(locale).parse({ timezone: "Europe/Paris", dailyGoalMinutes: 30 });
      expect(parsed.shareSubjectInFeed, locale).toBe(false);
    }
  });

  it("leaves the default export in French", () => {
    const r = settingsSchema.safeParse({ ...valid, dailyGoalMinutes: 5 });
    expect(r.success ? "" : r.error.issues[0]?.message).toMatch(/au moins 10 minutes/);
  });
});

describe("timezoneChoices in each language", () => {
  it("translates the labels and keeps the values", () => {
    expect(timezoneChoices("Europe/Paris", "en")[0]).toEqual({
      value: "Europe/Paris",
      label: "Mainland France (Paris)",
    });
    expect(timezoneChoices("Europe/Paris", "es")[0]).toEqual({
      value: "Europe/Paris",
      label: "Francia metropolitana (París)",
    });
    expect(timezoneChoices("Europe/Paris").map((o) => o.value)).toEqual(TIMEZONE_OPTIONS.map((o) => o.value));
  });

  it("keeps the current zone first when it is not listed", () => {
    expect(timezoneChoices("Asia/Tokyo", "es")[0]).toEqual({ value: "Asia/Tokyo", label: "Asia/Tokyo" });
  });
});
