import { expect, test } from "@playwright/test";

// Runs without a Supabase project: checks public pages and that protected
// routes are never reachable anonymously.
test("landing page links to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Révise mieux/ })).toBeVisible();
  await page
    .getByRole("link", { name: /se connecter/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/connexion/);
});

for (const path of [
  "/accueil",
  "/agenda",
  "/focus",
  "/focus/seance/00000000-0000-0000-0000-000000000000",
  "/social",
  "/profil",
]) {
  test(`anonymous visit to ${path} redirects to login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/connexion/);
  });
}

test("public demo shows sample screens without Supabase", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText("Pas encore disponible")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Social" })).toBeVisible();
});
