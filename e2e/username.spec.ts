import { expect, test, type Page } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

// Connected scenario (local fake Supabase, see e2e/academic.spec.ts). Skipped otherwise.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

async function signUp(page: Page) {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/accueil/);
}

test("Social requires a unique username", async ({ browser }) => {
  const pseudo = `pseudo_${Math.random().toString(36).slice(2, 10)}`;

  const first = await (await browser.newContext()).newPage();
  await signUp(first);
  await first.goto("/social");
  await expect(first.getByText("Choisis ton pseudo").first()).toBeVisible();
  await expect(first.getByText("Ajouter un ami")).toHaveCount(0);
  await first.getByLabel("Pseudo").fill(pseudo);
  await first.getByRole("button", { name: "Continuer" }).click();
  await skipOnboarding(first);
  await expect(first.getByText("Ajouter un ami")).toBeVisible();

  const second = await (await browser.newContext()).newPage();
  await signUp(second);
  await second.goto("/social");
  await second.getByLabel("Pseudo").fill(pseudo);
  await second.getByRole("button", { name: "Continuer" }).click();
  await expect(second.getByText("Ce pseudo est déjà pris.")).toBeVisible();
  await second.getByLabel("Pseudo").fill("a!");
  await second.getByRole("button", { name: "Continuer" }).click();
  await expect(second.getByText("Ajouter un ami")).toHaveCount(0);
});
