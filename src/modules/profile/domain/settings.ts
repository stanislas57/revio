/**
 * Private user settings (table `user_settings`, owner-only RLS). Pure: shared by the
 * server action (validation) and the settings form (options, bounds).
 *
 * D-16: the subject name is NEVER shared in the feed unless the user turns it on,
 * so `shareSubjectInFeed` defaults to false everywhere.
 */

import { z } from "zod";

export const GOAL_MIN_MINUTES = 10;
export const GOAL_MAX_MINUTES = 600;

export type UserSettings = {
  /** IANA time zone, e.g. "Europe/Paris". Days (streak, daily goal) follow it. */
  timezone: string;
  /** Daily study goal in minutes, 10 to 600. */
  dailyGoalMinutes: number;
  /** Publish a post in friends' feed when a shared session ends. */
  autoPost: boolean;
  /** Copy the subject name into feed posts (D-16: off by default). */
  shareSubjectInFeed: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  timezone: "Europe/Paris",
  dailyGoalMinutes: 30,
  autoPost: true,
  shareSubjectInFeed: false,
};

/** "Region/City" or "UTC": rejects numeric offsets, which the database does not know. */
const ZONE_SHAPE = /^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/;

/** Names the runtime lists, used to restore the usual spelling when only the case differs. */
const LISTED_ZONES: readonly string[] = [...Intl.supportedValuesOf("timeZone"), "UTC"];

/**
 * The time zone to store, or null when the runtime does not know it.
 * The name chosen by the user is kept as is (the engine rewrites some names to
 * older aliases, e.g. America/Montreal -> America/Toronto); only the case is fixed.
 */
export function normalizeTimeZone(value: string): string | null {
  if (!ZONE_SHAPE.test(value)) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
  } catch {
    return null;
  }
  return LISTED_ZONES.find((zone) => zone.toLowerCase() === value.toLowerCase()) ?? value;
}

/**
 * Input of the update action. The server validates everything again; the database
 * also checks the time zone against pg_timezone_names (trigger) and the goal range.
 */
export const settingsSchema = z.object({
  timezone: z
    .string()
    .trim()
    .max(64, { error: "Fuseau horaire invalide." })
    .transform((value, ctx) => {
      const zone = normalizeTimeZone(value);
      if (!zone) {
        ctx.addIssue({ code: "custom", message: "Fuseau horaire inconnu." });
        return z.NEVER;
      }
      return zone;
    }),
  dailyGoalMinutes: z
    .number({ error: "L'objectif doit être un nombre." })
    .int({ error: "L'objectif doit être un nombre entier de minutes." })
    .min(GOAL_MIN_MINUTES, { error: `L'objectif doit être d'au moins ${GOAL_MIN_MINUTES} minutes.` })
    .max(GOAL_MAX_MINUTES, { error: `L'objectif ne peut pas dépasser ${GOAL_MAX_MINUTES} minutes.` }),
  autoPost: z.boolean().default(DEFAULT_SETTINGS.autoPost),
  shareSubjectInFeed: z.boolean().default(DEFAULT_SETTINGS.shareSubjectInFeed),
});

export type UpdateSettingsInput = z.input<typeof settingsSchema>;

/** Zones offered in the form: France and the places French students are most likely to be. */
export const TIMEZONE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "Europe/Paris", label: "France métropolitaine (Paris)" },
  { value: "America/Martinique", label: "Martinique, Guadeloupe" },
  { value: "America/Cayenne", label: "Guyane" },
  { value: "Indian/Reunion", label: "La Réunion" },
  { value: "Indian/Mayotte", label: "Mayotte" },
  { value: "Pacific/Noumea", label: "Nouvelle-Calédonie" },
  { value: "Pacific/Tahiti", label: "Polynésie française (Tahiti)" },
  { value: "Europe/Brussels", label: "Belgique (Bruxelles)" },
  { value: "Europe/Zurich", label: "Suisse (Zurich)" },
  { value: "Europe/London", label: "Royaume-Uni (Londres)" },
  { value: "America/Montreal", label: "Québec (Montréal)" },
  { value: "UTC", label: "Temps universel (UTC)" },
];

/** The options, plus the user's current zone when it is not one of them. */
export function timezoneChoices(current: string): { value: string; label: string }[] {
  const known = TIMEZONE_OPTIONS.some((o) => o.value === current);
  return known ? [...TIMEZONE_OPTIONS] : [{ value: current, label: current }, ...TIMEZONE_OPTIONS];
}
