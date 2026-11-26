import { expect, test, type Page } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

const PROTECTED = ["/accueil", "/agenda", "/focus", "/social", "/profil"];

test.describe("anonymous visitor", () => {
  for (const path of PROTECTED) {
    test(`${path} sends to the login page, without showing the username screen`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/connexion/);
      await expect(page.getByText("Choisis ton pseudo")).toHaveCount(0);
    });
  }
});

// Connected scenario (local fake Supabase, see e2e/academic.spec.ts). Skipped otherwise.
test.describe("onboarding after sign-up", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  async function signUp(page: Page) {
    await page.goto("/connexion");
    await page.getByRole("button", { name: /Inscris-toi/ }).click();
    await page
      .getByLabel("E-mail")
      .fill(`onb-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
    await page.getByLabel("Mot de passe").fill("test-password-1");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
  }

  test("sign-up, username, then the home page; every tab is gated until then", async ({ page }) => {
    const pseudo = `onb_${Math.random().toString(36).slice(2, 10)}`;
    await signUp(page);

    // Right after sign-up: the username screen replaces the app, whatever the tab.
    await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    for (const path of PROTECTED) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toBeVisible();
    }

    // Invalid format: French message, nothing saved.
    await page.getByLabel("Pseudo").fill("a!");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.locator("#username-error")).toHaveText(/3 à 24 caractères/);
    await expect(page.getByLabel("Pseudo")).toHaveAttribute("aria-invalid", "true");

    // Valid username: the app opens (uppercase is converted).
    await page.getByLabel("Pseudo").fill(pseudo.toUpperCase());
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toHaveCount(0);
    await skipOnboarding(page);
    await page.goto("/accueil");
    await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
    await page.goto("/social");
    await expect(page.getByText("Ajouter un ami")).toBeVisible();
    await page.goto("/profil");
    await expect(page.getByLabel("Pseudo")).toHaveValue(pseudo);
  });

  test("a username already taken is refused in French", async ({ browser }) => {
    const pseudo = `pris_${Math.random().toString(36).slice(2, 10)}`;
    const first = await (await browser.newContext()).newPage();
    await signUp(first);
    await first.getByLabel("Pseudo").fill(pseudo);
    await first.getByRole("button", { name: "Continuer" }).click();
    await expect(first.getByRole("heading", { name: "Choisis ton pseudo" })).toHaveCount(0);
    await skipOnboarding(first);

    const second = await (await browser.newContext()).newPage();
    await signUp(second);
    await second.getByLabel("Pseudo").fill(pseudo);
    await second.getByRole("button", { name: "Continuer" }).click();
    await expect(second.locator("#username-error")).toHaveText("Ce pseudo est déjà pris.");
    await expect(second.getByRole("heading", { name: "Choisis ton pseudo" })).toBeVisible();
  });
});
