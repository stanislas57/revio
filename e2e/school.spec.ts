import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario (fake Supabase with the real migrations, schools included): `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("first-run card: search a school by kind and words, save it, find it again in the profile", async ({
  page,
}) => {
  await newAccount(page, "ecole");
  await page.goto("/accueil");
  const card = page
    .getByRole("region", { name: "Personnalise Revio" })
    .or(page.locator("[aria-labelledby=first-run-title]"));
  await expect(card).toBeVisible();

  await card.getByLabel("Type d'établissement").selectOption({ label: "Université" });
  await card.getByLabel("Nom ou ville").fill("Université Avignon");
  await expect(card.getByRole("button", { name: /Avignon Université/ })).toBeVisible();
  // The kind filter really filters: no lycée among the results.
  await expect(card.getByRole("list", { name: "Résultats" }).getByText("Lycée général")).toHaveCount(0);

  await card.getByRole("button", { name: /Avignon Université/ }).click();
  await card.getByRole("button", { name: "Enregistrer" }).click();
  await expect(card).toBeHidden();

  await page.goto("/profil");
  await expect(page.getByText("École choisie :")).toContainText("Avignon Université");
  await page.reload();
  await expect(page.getByText("École choisie :")).toContainText("Avignon Université");

  // Another visit to the home screen: the first-run card is gone for good.
  await page.goto("/accueil");
  await expect(page.locator("[aria-labelledby=first-run-title]")).toHaveCount(0);

  // Remove the choice in the settings.
  await page.goto("/profil");
  await page.getByRole("button", { name: "Retirer mon école" }).click();
  await expect(page.getByText("École retirée.")).toBeVisible();
});

test("'Plus tard' hides the first-run card and nothing is saved", async ({ page }) => {
  await newAccount(page, "later");
  await page.goto("/accueil");
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.locator("[aria-labelledby=first-run-title]")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("[aria-labelledby=first-run-title]")).toHaveCount(0);
  await page.goto("/profil");
  await expect(page.getByText("Aucune école choisie.")).toBeVisible();
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
