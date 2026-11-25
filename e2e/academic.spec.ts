import { expect, test } from "@playwright/test";

// Connected scenario: needs the local fake Supabase server (scripts/fake-supabase.mjs)
// and NEXT_PUBLIC_SUPABASE_* set when the app is built. Skipped otherwise (e.g. in CI).
//   node scripts/fake-supabase.mjs --port 54399 &
//   E2E_CONNECTED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 \
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-fake-key npm run test:e2e -- academic
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("academic flow: subject, grade, exam, simulator, delete", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/accueil/);

  // Convention Revio is always stated.
  await expect(page.getByText(/convention Revio/).first()).toBeVisible();

  // Validation is done server side too: a coefficient above 100 is refused.
  await page.getByLabel("Matière", { exact: true }).fill("Maths");
  await page.getByLabel("Coefficient").fill("500");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.getByText("Coefficient entre 0 et 100.")).toBeVisible();

  await page.getByLabel("Coefficient").fill("3");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  const card = page.locator("[data-slot=card]", { hasText: "Maths" }).filter({ hasText: "Coef. 3" });
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "Ajouter une note" }).click();
  await card.getByLabel("Note", { exact: true }).fill("8,5");
  await card.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(card.getByText("8,5/20")).toBeVisible();
  await expect(card.getByText("8,50", { exact: true })).toBeVisible();

  // Edit the grade.
  await card.getByRole("button", { name: "Modifier la note" }).click();
  await card.getByLabel("Note", { exact: true }).fill("12");
  await card.getByRole("button", { name: "Enregistrer" }).click();
  await expect(card.getByText("12/20")).toBeVisible();

  // Grade above the scale is refused.
  await card.getByRole("button", { name: "Ajouter une note" }).click();
  await card.getByLabel("Note", { exact: true }).fill("25");
  await card.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(card.getByText("La note dépasse le barème.")).toBeVisible();
  await card.getByRole("button", { name: "Annuler" }).click();

  // Overall target and dashboard gap.
  await page.getByLabel("Objectif de moyenne (/20)").fill("14");
  await page.getByRole("button", { name: "Enregistrer" }).first().click();
  await expect(page.getByText(/Il manque 2,00 points/)).toBeVisible();

  // Exam.
  await page.getByLabel("Examen", { exact: true }).fill("Partiel de maths");
  await page.getByLabel("Date", { exact: true }).fill("2099-01-15");
  await page.getByRole("button", { name: "Ajouter l'examen" }).click();
  await expect(page.getByText("Partiel de maths")).toBeVisible();

  // Simulator: one more grade at coefficient 1 to reach 14 overall → (12*3 + x)/4 >= 14 → x >= 20.
  await expect(
    page.getByRole("status").filter({ hasText: /pour atteindre|Impossible|garanti/ }),
  ).toBeVisible();

  // Delete subject needs a confirmation.
  await card.getByRole("button", { name: "Supprimer", exact: true }).click();
  await card.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Aucune matière pour l'instant")).toBeVisible();
});
