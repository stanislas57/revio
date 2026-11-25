/**
 * Interface languages. French is the product's language and the default; English and Spanish are
 * offered in the settings screen. The choice is kept in a cookie (no database column yet).
 */

export const LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "revio_locale";

/** Each language is written in itself, so it can be recognised whatever the current language. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** A cookie value to a language: anything unknown or missing falls back to French. */
export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
