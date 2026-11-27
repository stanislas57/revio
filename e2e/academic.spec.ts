import { expect, test } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

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
  // The username screen replaces the app until a username is chosen.
  await page.getByLabel("Pseudo").fill(`acad_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await skipOnboarding(page);

  // Convention Revio is always stated, on « Mes notes ».
  await page.goto("/notes");
  await expect(page.getByText(/convention Revio/).first()).toBeVisible();

  // Validation is done server side too: a coefficient above 100 is refused (on « Importer · ajouter »).
  await page.goto("/notes/importer#ajouter-matiere");
  await page.getByLabel("Matière", { exact: true }).fill("Maths");
  await page.getByLabel("Coefficient").fill("500");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.getByText("Coefficient entre 0 et 100.")).toBeVisible();

  await page.getByLabel("Coefficient").fill("3");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.getByLabel("Matière", { exact: true })).toHaveValue("");
  await page.goto("/notes");
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
  await page
    .locator("form", { has: page.locator("#target") })
    .getByRole("button", { name: "Enregistrer" })
    .click();
  await expect(page.getByText(/Objectif 14,00 : il manque 2,00 points/)).toBeVisible();

  // Exam.
  await page.getByLabel("Examen", { exact: true }).fill("Partiel de maths");
  await page.getByLabel("Date", { exact: true }).fill("2099-01-15");
  await page.getByRole("button", { name: "Ajouter l'examen" }).click();
  // The exam is in the list, and it is the next one in the summary card.
  await expect(page.getByRole("listitem").filter({ hasText: "Partiel de maths" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Prochain examen" })).toContainText("Partiel de maths");

  // Simulator (its own page): one more grade at coefficient 1 to reach 14 overall → (12*3 + x)/4 >= 14 → x >= 20.
  await page.goto("/notes/simulateur");
  await expect(
    page.getByRole("status").filter({ hasText: /pour atteindre|Impossible|garanti/ }),
  ).toBeVisible();

  // Delete subject needs a confirmation.
  await page.goto("/notes");
  await card.getByRole("button", { name: "Supprimer", exact: true }).click();
  await card.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Aucune matière pour l'instant")).toBeVisible();
});
