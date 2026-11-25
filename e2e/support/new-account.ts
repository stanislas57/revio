import { expect, type Page } from "@playwright/test";

/** Signs up a brand-new account on the local fake server and chooses a username. Returns the username. */
export async function newAccount(page: Page, prefix = "e2e"): Promise<string> {
  const username = `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByLabel("Pseudo").fill(username);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toHaveCount(0);
  return username;
}
