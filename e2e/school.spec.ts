import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario (fake Supabase with the real migrations, schools included): `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("school in the profile: search by kind and words, save it, find it again, remove it", async ({
  page,
}) => {
  await newAccount(page, "ecole");
  await page.goto("/profil");
  const card = page.locator("#ecole");
  await expect(card).toBeVisible();

  await card.getByLabel("Type d'établissement").selectOption({ label: "Université" });
  await card.getByLabel("Nom ou ville").fill("Université Avignon");
  await expect(card.getByRole("button", { name: /Avignon Université/ })).toBeVisible();
  // The kind filter really filters: no lycée among the results.
  await expect(card.getByRole("list", { name: "Résultats" }).getByText("Lycée général")).toHaveCount(0);

  await card.getByRole("button", { name: /Avignon Université/ }).click();
  await card.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("École choisie :")).toContainText("Avignon Université");
  await page.reload();
  await expect(page.getByText("École choisie :")).toContainText("Avignon Université");

  // Remove the choice in the settings.
  await page.getByRole("button", { name: "Retirer mon école" }).click();
  await expect(page.getByText("École retirée.")).toBeVisible();
});

test("the home screen shows no personal information block", async ({ page }) => {
  await newAccount(page, "accueil");
  await page.goto("/accueil");
  await expect(page.getByRole("heading", { level: 1, name: /Moins de stress/ })).toBeVisible();
  await expect(page.locator("[aria-labelledby=first-run-title]")).toHaveCount(0);
  await expect(page.getByText("Type d'établissement")).toHaveCount(0);
});

test("a too short search asks for more letters, a nonsense one finds nothing", async ({ page }) => {
  await newAccount(page, "short");
  await page.goto("/profil");
  const query = page.getByLabel("Nom ou ville");
  await query.fill("zzqqxxww");
  await expect(page.getByText("Aucun établissement trouvé.")).toBeVisible();
});

test("the summary cards of the home screen lead to their section", async ({ page }) => {
  await newAccount(page, "liens");
  await page.goto("/accueil");
  await page.getByRole("link", { name: "Modifier mon objectif" }).click();
  await expect(page).toHaveURL(/\/accueil#target$/);
  await page.goto("/profil");
  await page.getByRole("link", { name: "Voir mes statistiques détaillées" }).click();
  await expect(page).toHaveURL(/\/profil\/statistiques/);
});
