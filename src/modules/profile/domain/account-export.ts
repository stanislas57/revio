/**
 * Export of the user's own data (RGPD "portabilité"). Pure: which tables are exported, how the
 * JSON document is assembled, and the confirmation word for account deletion.
 *
 * Every table is read with RLS AND an explicit owner filter: some tables are readable by friends
 * (sessions, posts, stats), and an export must never contain somebody else's rows.
 */

/** `column` is the column holding the owner's id. */
export const EXPORT_TABLES = [
  { key: "profile", table: "profiles", column: "id" },
  { key: "settings", table: "user_settings", column: "user_id" },
  { key: "academicSettings", table: "academic_settings", column: "user_id" },
  { key: "subjects", table: "subjects", column: "user_id" },
  { key: "grades", table: "grades", column: "user_id" },
  { key: "exams", table: "exams", column: "user_id" },
  { key: "simulationScenarios", table: "simulation_scenarios", column: "user_id" },
  { key: "calendarEvents", table: "calendar_events", column: "user_id" },
  { key: "studySessions", table: "study_sessions", column: "user_id" },
  { key: "xpTransactions", table: "xp_transactions", column: "user_id" },
  { key: "stats", table: "user_stats", column: "user_id" },
  { key: "achievements", table: "user_achievements", column: "user_id" },
  { key: "notifications", table: "notifications", column: "user_id" },
  { key: "posts", table: "posts", column: "user_id" },
  { key: "reactions", table: "post_reactions", column: "user_id" },
] as const;

export type ExportKey = (typeof EXPORT_TABLES)[number]["key"] | "friendships";

export type ExportDocument = {
  format: "revio-export";
  version: 1;
  generatedAt: string;
  account: { email: string | null };
  /** Plain-language limits of the export. */
  notes: string[];
  data: Record<string, unknown[]>;
  /** Tables that do not exist on this deployment yet (older database): exported as empty. */
  skippedTables: string[];
};

export const EXPORT_NOTES = [
  "Ce fichier contient les données que Revio garde sur toi : ton profil, tes réglages, tes matières, notes, examens, scénarios du simulateur, trophées, notifications, événements d'agenda, séances, XP, statistiques, publications, réactions et amitiés.",
  "Les amitiés ne contiennent que les identifiants des deux comptes. Les données des autres utilisateurs ne sont pas incluses.",
  "Les moyennes affichées dans l'application sont calculées (convention Revio) et ne sont pas stockées : elles ne figurent pas ici.",
];

export function buildExport(input: {
  now: Date;
  email: string | null;
  data: Record<string, unknown[]>;
  skippedTables: string[];
}): ExportDocument {
  return {
    format: "revio-export",
    version: 1,
    generatedAt: input.now.toISOString(),
    account: { email: input.email },
    notes: EXPORT_NOTES,
    data: input.data,
    skippedTables: input.skippedTables,
  };
}

export function exportFilename(now: Date): string {
  return `revio-export-${now.toISOString().slice(0, 10)}.json`;
}

/** The word to type to confirm an account deletion. */
export const DELETE_CONFIRMATION = "SUPPRIMER";

export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim().toUpperCase() === DELETE_CONFIRMATION;
}
