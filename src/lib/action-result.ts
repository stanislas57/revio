import "server-only";
import type { ActionError, ActionResult, ErrorCode } from "@/lib/contracts";

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): ActionResult<never> => ({
  ok: false,
  error: { code, message, ...(fields ? { fields } : {}) } satisfies ActionError,
});

const MESSAGES: Record<ErrorCode, string> = {
  unauthenticated: "Ta session a expiré. Reconnecte-toi.",
  forbidden: "Action non autorisée.",
  not_found: "Élément introuvable.",
  validation: "Données invalides.",
  conflict: "Cette action n'est plus possible dans l'état actuel.",
  rate_limited: "Trop de tentatives. Réessaie dans un instant.",
  internal: "Une erreur est survenue. Réessaie.",
};

/** Maps a PostgREST / Postgres error to a contract error without leaking its details. */
export function fromDbError(error: { code?: string }, overrides: Partial<Record<ErrorCode, string>> = {}) {
  const code: ErrorCode =
    error.code === "23505" || error.code === "55000"
      ? "conflict"
      : error.code === "42501"
        ? "forbidden"
        : error.code === "P0002" || error.code === "PGRST116"
          ? "not_found"
          : error.code === "22001" || error.code === "23514" || error.code === "22P02"
            ? "validation"
            : "internal";
  return fail(code, overrides[code] ?? MESSAGES[code]);
}
