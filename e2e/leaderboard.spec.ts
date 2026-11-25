import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The leaderboard is private: an anonymous visitor is sent to the login page, whatever the query.
test("anonymous visit to the leaderboard redirects to login", async ({ page }) => {
  for (const url of ["/social/classement", "/social/classement?demo=1", "/social/classement?etat=quitte"]) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/connexion/);
  }
  await expect(page.getByText("Tes XP de la semaine")).toHaveCount(0);
});

test.describe("leaderboard (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("shows my real position, and leaving then rejoining is saved", async ({ page }) => {
    await newAccount(page, "lb");
    await page.goto("/social/classement");
    // No sample data any more: nothing is labelled "Exemple".
    await expect(page.getByText("Données d'exemple")).toHaveCount(0);
    await expect(page.getByText("Tes XP de la semaine")).toBeVisible();

    await page.getByRole("button", { name: "Quitter le classement" }).click();
    await page.getByRole("button", { name: "Quitter", exact: true }).click();
    await expect(page.getByText("Tu as quitté le classement")).toBeVisible();

    // The choice is stored by the database: it survives a reload.
    await page.reload();
    await expect(page.getByText("Tu as quitté le classement")).toBeVisible();

    await page.getByRole("button", { name: "Revenir dans le classement" }).click();
    await expect(page.getByRole("button", { name: "Quitter le classement" })).toBeVisible();
  });
});
