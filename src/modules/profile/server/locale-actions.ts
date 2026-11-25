"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { fail, succeed } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";
import { requireUser } from "@/lib/auth";
import { LOCALES, LOCALE_COOKIE, type Locale } from "../domain/locale";
import { SETTINGS_MESSAGES } from "../domain/settings-messages";
import { getLocale } from "./locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Chooses the interface language. It is a preference of the browser, kept in a cookie: no
 * database column exists yet (a `locale` column in `user_settings` would let it follow the account).
 */
export async function setLocale(locale: string): Promise<ActionResult<Locale>> {
  await requireUser();
  const parsed = z.enum(LOCALES).safeParse(locale);
  if (!parsed.success) {
    return fail({ code: "validation", message: SETTINGS_MESSAGES[await getLocale()].errors.invalid });
  }
  (await cookies()).set(LOCALE_COOKIE, parsed.data, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  refresh();
  return succeed(parsed.data);
}
