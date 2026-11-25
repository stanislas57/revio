import { expect, test } from "@playwright/test";

// The statistics are private: an anonymous visitor is sent to the login page.
test("anonymous visit to the statistics redirects to login", async ({ page }) => {
  for (const url of ["/profil/statistiques", "/profil/statistiques?etat=vide"]) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/connexion/);
  }
  await expect(page.getByText("Temps par jour")).toHaveCount(0);
});
