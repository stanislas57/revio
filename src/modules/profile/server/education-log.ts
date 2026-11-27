import "server-only";

/**
 * Server log of a failed read or write of the onboarding data. The user only sees a short message; this line is
 * what tells the developers why (for example `42703` / `PGRST204` = a column that the database does not have yet,
 * so a migration is not applied). It holds a code, a table or column name and no personal data.
 */
export function logEducationError(where: string, error: { code?: string; message?: string }) {
  console.error(`[education] ${where} failed: ${error.code ?? "no code"} ${error.message ?? ""}`.trim());
}
