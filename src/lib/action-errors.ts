/**
 * Maps a Postgres / PostgREST error to the ActionError contract.
 * Messages are generic French sentences: never echo the database message
 * (it can leak table or constraint names).
 */

import type { ActionError, ActionResult } from "./contracts";

type DbError = { code?: string | null; message?: string | null } | null | undefined;

export function toActionError(error: DbError, overrides: Partial<Record<string, string>> = {}): ActionError {
  const code = error?.code ?? "";
  const custom = overrides[code];
  switch (code) {
    case "42501":
      return { code: "unauthenticated", message: custom ?? "Connecte-toi pour continuer." };
    case "P0002":
    case "PGRST116":
      return { code: "not_found", message: custom ?? "Élément introuvable." };
    case "23505":
    case "55000":
      return { code: "conflict", message: custom ?? "Action impossible dans l'état actuel." };
    case "23503":
    case "23514":
    case "22023":
    case "22P02":
      return { code: "validation", message: custom ?? "Données invalides." };
    default:
      return { code: "internal", message: custom ?? "Une erreur est survenue. Réessaie dans un instant." };
  }
}

export function fail<T>(error: ActionError): ActionResult<T> {
  return { ok: false, error };
}

export function succeed<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
