import { expect, test } from "@playwright/test";

// Runs without a Supabase project. The settings live in the Profil page, which is
// private: an anonymous visitor must never see them, whatever the URL fragment.
test.describe("settings (anonymous)", () => {
  test("the settings anchor redirects to the login page", async ({ page }) => {
    await page.goto("/profil#reglages");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("no settings form is exposed on the public pages", async ({ page }) => {
    for (const path of ["/", "/connexion"]) {
      await page.goto(path);
      await expect(page.getByRole("button", { name: /enregistrer les réglages/i })).toHaveCount(0);
      await expect(page.getByLabel(/fuseau horaire/i)).toHaveCount(0);
      await expect(page.getByLabel(/objectif du jour/i)).toHaveCount(0);
    }
  });
});
