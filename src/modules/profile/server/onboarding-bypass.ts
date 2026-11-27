"use server";

import { cookies } from "next/headers";
import { succeed } from "@/lib/action-errors";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/contracts";
import { ONBOARDING_BYPASS_COOKIE, ONBOARDING_BYPASS_MAX_AGE } from "../domain/onboarding";

/**
 * "Continuer sans enregistrer": when the answers cannot be saved, the person still enters the app. Nothing is
 * written to the database; a cookie (no data in it) tells the app layout not to show the onboarding for a day.
 */
export async function continueWithoutSaving(): Promise<ActionResult<null>> {
  await requireUser();
  (await cookies()).set(ONBOARDING_BYPASS_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONBOARDING_BYPASS_MAX_AGE,
  });
  return succeed(null);
}
