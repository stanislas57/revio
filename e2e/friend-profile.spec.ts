import { expect, test } from "@playwright/test";

// A friend's profile is private: an anonymous visitor is sent to the login page.
test("anonymous visit to a social profile redirects to login", async ({ page }) => {
  await page.goto("/social/amis/00000000-0000-4000-8000-000000000002");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByText("Dernières séances partagées")).toHaveCount(0);
});
