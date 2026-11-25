import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("scenario simulator: several hypothetical grades, save, reload, load, delete; time split", async ({
  page,
}) => {
  await newAccount(page, "scn");
  await page.goto("/accueil");
  await page.getByLabel("Matière", { exact: true }).fill("Maths");
  await page.getByLabel("Coefficient").fill("2");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  const card = page.locator("[data-slot=card]", { hasText: "Maths" }).filter({ hasText: "Coef. 2" });
  await card.getByRole("button", { name: "Ajouter une note" }).click();
  await card.getByLabel("Note", { exact: true }).fill("10");
  await card.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(card.getByText("10/20")).toBeVisible();

  // Two hypothetical grades in the same subject: (10 + 18 + 14) / 3 = 14.
  await page.getByLabel("Note", { exact: true }).last().fill("18");
  await page.getByRole("button", { name: "Ajouter une note" }).last().click();
  await page.locator("#sc-value-2").fill("14");
  await expect(page.getByText(/Moyenne générale :/)).toContainText("14,00");

  // Saved scenarios are stored in the database: they survive a reload.
  await page.getByLabel("Nom du scénario").fill("Plan A");
  await page.getByRole("button", { name: "Enregistrer ce scénario" }).click();
  await expect(page.getByText("Mes scénarios (1/20)")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Plan A · 2 notes")).toBeVisible();
  await page.getByRole("button", { name: "Charger" }).click();
  await expect(page.locator("#sc-value-1")).toHaveValue("18");
  await page.getByRole("button", { name: "Supprimer le scénario Plan A" }).click();
  await expect(page.getByText("Mes scénarios")).toHaveCount(0);

  // The real grade is untouched by the hypotheses.
  await expect(card.getByText("10/20")).toBeVisible();

  // Time split: three modes, always adding up to the time available.
  const planner = page.locator("[data-slot=card]", { hasText: "Répartir mon temps" });
  await page.getByLabel("Heures disponibles").fill("2");
  for (const mode of ["Selon mes priorités", "Équilibré", "Rentabilité de la moyenne"]) {
    await page.locator("#tp-mode").selectOption({ label: mode });
    await expect(planner.getByRole("status")).toContainText("Maths : 2 h");
  }
  await expect(page.getByText(/pas une prévision/).first()).toBeVisible();
});
