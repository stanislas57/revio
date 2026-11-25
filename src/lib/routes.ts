export const LOGIN_PATH = "/connexion";
export const HOME_PATH = "/accueil";

/** Routes that require a signed-in user. Keep in sync with src/app/(app). */
export const PROTECTED_PREFIXES = ["/accueil", "/agenda", "/focus", "/social", "/profil", "/apercu"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_PATH;
  }
  return next;
}
