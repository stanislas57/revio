import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "../domain/locale";

/** The interface language chosen by the user (cookie), French when none or unknown. */
export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
