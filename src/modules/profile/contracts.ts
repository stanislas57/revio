/** Profile contracts (see API_CONTRACTS.md, section 3). Types only. */

import type { PublicUser } from "@/lib/contracts";

export type MyProfile = PublicUser & {
  /** Never shown to other users. */
  email: string;
  /** IANA time zone, "Europe/Paris" by default. */
  timezone: string;
  dailyGoalMinutes: number;
  /** true → show the "choose your username" screen. */
  needsUsername: boolean;
};

export type UpdateProfileInput = {
  /** ^[a-z0-9_]{3,24}$ */
  username?: string;
  /** At most 60 characters. */
  displayName?: string;
};
