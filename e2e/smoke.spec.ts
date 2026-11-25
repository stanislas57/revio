import { expect, test } from "@playwright/test";

// Runs without a Supabase project: checks public pages and that protected
// routes are never reachable anonymously.
test("landing page links to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Revio" })).toBeVisible();
  await page.getByRole("link", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/connexion/);
});

for (const path of ["/accueil", "/agenda", "/focus", "/social", "/profil"]) {
  test(`anonymous visit to ${path} redirects to login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/connexion/);
  });
}
