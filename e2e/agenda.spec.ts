import { expect, test } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

// Connected scenario (fake Supabase server): see docs/E2E.md. Skipped without E2E_CONNECTED.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("agenda: add, repeat, conflict, edit, views, delete", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`agenda-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByLabel("Pseudo").fill(`ag_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await skipOnboarding(page);

  // Work in a fixed week (Mon 7 Dec 2026 → Sun 13 Dec) so the test does not depend on today's date.
  await page.goto("/agenda?vue=semaine&date=2026-12-07");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

  // The detailed form is folded under the quick path: open it.
  await page.getByText("Saisie détaillée").click();
  // Server-side validation: end before start is refused.
  await page.getByLabel("Titre").fill("Révision maths");
  await page.getByLabel("Date").fill("2026-12-07");
  await page.getByLabel("Début").fill("18:00");
  await page.getByLabel("Fin").fill("17:00");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  await expect(page.getByText("La fin doit être après le début.")).toBeVisible();

  // A valid, weekly slot: appears on Monday 7 and Monday 14 (next week).
  await page.getByLabel("Fin").fill("19:00");
  await page.getByLabel("Répétition").selectOption("weekly");
  await page.getByLabel("Jusqu'au").fill("2026-12-21");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  const monday = page.getByRole("region", { name: /lundi 7 décembre 2026/ });
  await expect(monday.getByText("Révision maths")).toBeVisible();
  await expect(monday.getByText("répété")).toBeVisible();

  // A class overlapping the slot is flagged as a conflict on both.
  await page.getByLabel("Titre").fill("Cours de droit");
  await page.getByLabel("Type").selectOption("class");
  await page.getByLabel("Date").fill("2026-12-07");
  await page.getByLabel("Début").fill("18:30");
  await page.getByLabel("Fin").fill("20:00");
  await page.getByLabel("Répétition").selectOption("none");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  await expect(monday.getByText("chevauche un autre créneau")).toHaveCount(2);

  // Next week shows the repeated slot, without the one-off class.
  await page.getByRole("link", { name: "Période suivante" }).click();
  const nextMonday = page.getByRole("region", { name: /lundi 14 décembre 2026/ });
  await expect(nextMonday.getByText("Révision maths")).toBeVisible();
  await expect(page.getByText("Cours de droit")).toHaveCount(0);

  // Month view lists the day, which links to the day view.
  await page.getByRole("link", { name: "Mois" }).click();
  await expect(page.getByRole("group", { name: "Mois" })).toBeVisible();
  await page.getByRole("link", { name: /^lundi 14 décembre 2026, 1 élément$/ }).click();
  await expect(page).toHaveURL(/vue=jour/);
  await expect(page.getByText("Révision maths")).toBeVisible();

  // Edit the series, then delete it (the confirmation dialog is accepted).
  await page.getByRole("button", { name: "Modifier Révision maths" }).click();
  await page.getByLabel("Titre").first().fill("Révision algèbre");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Révision algèbre")).toBeVisible();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Supprimer Révision algèbre" }).click();
  await expect(page.getByText("Rien de prévu.")).toBeVisible();
});
