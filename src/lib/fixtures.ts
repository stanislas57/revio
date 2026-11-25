/** SAMPLE users shared by module fixtures. Display <MockBadge /> wherever they appear. */

import type { PublicUser } from "./contracts";

export const FIXTURE_USERS = {
  stani: {
    id: "00000000-0000-4000-8000-000000000001",
    username: "stani",
    displayName: "Stani",
    avatarUrl: null,
  },
  charles: {
    id: "00000000-0000-4000-8000-000000000002",
    username: "charles",
    displayName: "Charles",
    avatarUrl: null,
  },
  lea: {
    id: "00000000-0000-4000-8000-000000000003",
    username: "lea_m",
    displayName: "Léa",
    avatarUrl: null,
  },
  noUsername: {
    id: "00000000-0000-4000-8000-000000000004",
    username: null,
    displayName: "",
    avatarUrl: null,
  },
} satisfies Record<string, PublicUser>;

/** Fixed "now" used by fixtures, so screenshots and tests are stable. */
export const FIXTURE_NOW = "2026-11-25T17:30:00Z";
