import { expect, test } from "@playwright/test";

// The leaderboard is private: an anonymous visitor is sent to the login page, whatever the query.
test("anonymous visit to the leaderboard redirects to login", async ({ page }) => {
  for (const url of ["/social/classement", "/social/classement?demo=1", "/social/classement?etat=quitte"]) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/connexion/);
  }
  await expect(page.getByText("Tes XP de la semaine")).toHaveCount(0);
});
