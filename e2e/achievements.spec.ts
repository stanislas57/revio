import { expect, test } from "@playwright/test";

// The gallery is private: an anonymous visitor is sent to the login page.
test("anonymous visit to the achievements gallery redirects to login", async ({ page }) => {
  await page.goto("/profil/trophees");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByText("Aucun de ces trophées")).toHaveCount(0);
});
