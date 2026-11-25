/**
 * Shared data contracts (see API_CONTRACTS.md).
 * Types only: safe to import from client and server code.
 */

export type Uuid = string;
/** ISO 8601 date-time in UTC, e.g. "2026-11-25T17:30:00Z". */
export type IsoDateTime = string;
/** Calendar day "YYYY-MM-DD", in the user's time zone. */
export type IsoDate = string;

export type ErrorCode =
  "unauthenticated" | "forbidden" | "not_found" | "validation" | "conflict" | "rate_limited" | "internal";

export type ActionError = {
  code: ErrorCode;
  /** French, safe to display as is. */
  message: string;
  fields?: Record<string, string>;
};

/** Return type of every Server Action. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

/** Public identity of a user: the only user data other users may see by default. */
export type PublicUser = {
  id: Uuid;
  /** null until the user has chosen a username. */
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
};
