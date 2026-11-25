import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";

// The gallery is private: an anonymous visitor is sent to the login page.
test("anonymous visit to the achievements gallery redirects to login", async ({ page }) => {
  await page.goto("/profil/trophees");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByText("Aucun de ces trophées")).toHaveCount(0);
});

test.describe("achievements (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("a new account has real, locked achievements; a finished session unlocks 'Premier pas'", async ({
    page,
  }) => {
    const username = await newAccount(page, "ach");
    await page.goto("/profil/trophees");
    await expect(page.getByText("Aucun de ces trophées")).toHaveCount(0);
    await expect(page.getByText("Premier pas")).toBeVisible();
    await expect(page.getByText("Indestructible")).toBeVisible();

    await page.goto("/focus");
    await page.getByRole("button", { name: "Démarrer" }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    const shift = await fetch(`${FAKE_URL}/__test/advance-clock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minutes: 12, username }),
    });
    expect(shift.ok, "the fake server must be started with --test-clock").toBe(true);
    await page.reload();
    await page.getByRole("button", { name: "Terminer" }).click();
    await expect(page).toHaveURL(/\/focus\/seance\//);

    await page.goto("/profil/trophees");
    await page.getByRole("button", { name: /Débloqués/ }).click();
    await expect(page.getByText("Premier pas")).toBeVisible();
    await expect(page.getByText("Indestructible")).toHaveCount(0);
  });
});
