/** SAMPLE DATA. Any screen showing these must display <MockBadge />. */

import { FIXTURE_USERS } from "@/lib/fixtures";
import type { MyProfile } from "./contracts";

export const FIXTURE_MY_PROFILE: MyProfile = {
  ...FIXTURE_USERS.stani,
  email: "stani@example.com",
  timezone: "Europe/Paris",
  dailyGoalMinutes: 30,
  needsUsername: false,
};

export const FIXTURE_MY_PROFILE_NEW: MyProfile = {
  ...FIXTURE_USERS.noUsername,
  email: "nouveau@example.com",
  timezone: "Europe/Paris",
  dailyGoalMinutes: 30,
  needsUsername: true,
};
