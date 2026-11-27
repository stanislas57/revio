import { expect, test, type Page } from "@playwright/test";
import { newAccountBeforeOnboarding } from "./support/new-account";

// The onboarding must never keep someone out of their account. The fake server (started with --test-clock) can
// make `user_education` behave as on a database where the study_level / gender migration was never applied
// ("missing-columns") or as if it were down ("all"), for one user only.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";

async function breakEducation(username: string, mode: "missing-columns" | "all") {
  const res = await fetch(`${FAKE_URL}/__test/break-education`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, mode }),
  });
  expect(res.ok).toBe(true);
}

const onboarding = (page: Page) => page.getByRole("heading", { name: "Personnalise Revio" });
// Next.js has its own role="alert" (route announcer): the error block is found by its text.
const failure = (page: Page) => page.getByRole("alert").filter({ hasText: "Impossible d'enregistrer" });
const appNav = (page: Page) => page.getByRole("navigation", { name: "Navigation principale" }).first();

test("a failed read is not « onboarding not done »: the app opens, Mes informations says it is unavailable", async ({
  page,
}) => {
  const username = await newAccountBeforeOnboarding(page, "readfail");
  await expect(onboarding(page)).toBeAttached();

  await breakEducation(username, "missing-columns");
  await page.goto("/accueil");
  await expect(onboarding(page)).toHaveCount(0);
  await expect(appNav(page)).toBeVisible();

  await page.goto("/profil");
  await expect(page.locator("#mes-informations").getByRole("status")).toContainText(
    "ne sont pas disponibles",
  );
  await expect(page.getByRole("heading", { name: "Mon école" })).toHaveCount(0);
});

test("saving the answers fails: a clear message, then « Continuer sans enregistrer » opens /accueil", async ({
  page,
}) => {
  const username = await newAccountBeforeOnboarding(page, "savefail");
  await expect(onboarding(page)).toBeAttached();
  await breakEducation(username, "missing-columns");

  // Answer the study level and the gender, so the save carries the columns that "do not exist".
  await page.getByRole("button", { name: "Continuer" }).click();
  await page
    .getByRole("radiogroup", { name: "En quelle année es-tu ?" })
    .getByRole("radio", { name: /Terminale/ })
    .click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page
    .getByRole("radiogroup", { name: "Tu es…" })
    .getByRole("radio", { name: "Fille ou femme" })
    .click();
  await page.getByRole("button", { name: "Terminer" }).click();

  const alert = failure(page);
  await expect(alert).toContainText("Impossible d'enregistrer tes informations pour le moment");
  await expect(onboarding(page)).toBeAttached();
  // The buttons stay usable: the person is not stuck.
  await expect(page.getByRole("button", { name: "Plus tard" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Terminer" })).toBeEnabled();

  await alert.getByRole("button", { name: "Continuer sans enregistrer" }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(onboarding(page)).toHaveCount(0);
  await expect(appNav(page)).toBeVisible();

  // Still in the app on the next visits.
  await page.goto("/social");
  await expect(onboarding(page)).toHaveCount(0);
  await expect(appNav(page)).toBeVisible();
});

test("even « Plus tard » failing leaves a way into the app", async ({ page }) => {
  const username = await newAccountBeforeOnboarding(page, "laterfail");
  await expect(onboarding(page)).toBeAttached();
  await breakEducation(username, "all");

  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(failure(page)).toContainText("Impossible d'enregistrer tes informations pour le moment");
  await page.getByRole("button", { name: "Continuer sans enregistrer" }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(appNav(page)).toBeVisible();
});

test("with nothing answered, « Terminer » is clickable and « Plus tard » is on every screen", async ({
  page,
}) => {
  await newAccountBeforeOnboarding(page, "emptyok");
  const later = page.getByRole("button", { name: "Plus tard" });
  await expect(later).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuer" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(later).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(later).toBeVisible();
  await expect(page.getByRole("button", { name: "Terminer" })).toBeEnabled();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(onboarding(page)).toHaveCount(0);
  await expect(appNav(page)).toBeVisible();
});
