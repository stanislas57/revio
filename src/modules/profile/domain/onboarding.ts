/**
 * Rules that keep the onboarding from ever trapping someone out of the app. Pure: used by the app layout (server)
 * and tested on their own.
 */

/** Set by "Continuer sans enregistrer": the onboarding is not shown again for a day, whatever the database says. */
export const ONBOARDING_BYPASS_COOKIE = "revio-onboarding-later";
export const ONBOARDING_BYPASS_MAX_AGE = 60 * 60 * 24;

/** Shown when saving the answers (or "Plus tard") fails: says what happens next, never blocks. */
export const ONBOARDING_SAVE_ERROR =
  "Impossible d'enregistrer tes informations pour le moment. Tu peux continuer sans les enregistrer et les renseigner plus tard dans Profil.";

/**
 * Whether the onboarding must be shown. Only when we KNOW it is not done: a failed read (`unavailable`) is not
 * "not done", and someone who chose to continue without saving is let in.
 */
export function needsOnboarding(
  education: { onboardingDone: boolean; unavailable: boolean },
  bypass: boolean,
) {
  return !bypass && !education.unavailable && !education.onboardingDone;
}
