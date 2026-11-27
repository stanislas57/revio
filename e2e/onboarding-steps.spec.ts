import { expect, test } from "@playwright/test";
import { newAccountBeforeOnboarding } from "./support/new-account";

// Connected scenario (fake Supabase with the real migrations, schools included): `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("onboarding: one question per screen, then the answers are in « Mes informations »", async ({
  page,
}) => {
  const username = await newAccountBeforeOnboarding(page, "onb");
  await expect(page.getByRole("heading", { name: "Personnalise Revio" })).toBeAttached();
  await expect(page.getByText(`Bienvenue, ${username} !`)).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Question 1 sur 3" })).toBeVisible();

  // 1. School: every question is optional, so "Continuer" is clickable even before a choice.
  const next = page.getByRole("button", { name: "Continuer" });
  await expect(next).toBeEnabled();
  await page.getByLabel("Nom ou ville").fill("Université Avignon");
  await page.getByRole("button", { name: /Avignon Université/ }).click();
  await next.click();

  // 2. Study level: big tiles in a radio group.
  await expect(page.getByRole("progressbar", { name: "Question 2 sur 3" })).toBeVisible();
  const levels = page.getByRole("radiogroup", { name: "En quelle année es-tu ?" });
  await levels.getByRole("radio", { name: /Terminale/ }).click();
  await expect(levels.getByRole("radio", { name: /Terminale/ })).toHaveAttribute("aria-checked", "true");
  await next.click();

  // 3. Gender (optional): "Je préfère ne pas répondre" is an answer, then "Terminer" opens the app.
  const genders = page.getByRole("radiogroup", { name: "Tu es…" });
  await genders.getByRole("radio", { name: "Je préfère ne pas répondre" }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page.getByRole("heading", { name: "Personnalise Revio" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Navigation principale" }).first()).toBeVisible();

  // Never again.
  await page.goto("/accueil");
  await expect(page.getByRole("heading", { name: "Personnalise Revio" })).toHaveCount(0);

  // Réglages > Mes informations: the three answers, editable.
  await page.goto("/profil");
  const info = page.locator("#mes-informations");
  await expect(info.getByText("École choisie :")).toContainText("Avignon Université");
  await expect(info.getByRole("radio", { name: /Terminale/ })).toHaveAttribute("aria-checked", "true");
  await expect(info.getByRole("radio", { name: "Je préfère ne pas répondre" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await info.getByRole("radio", { name: "Fille ou femme" }).click();
  await info.getByRole("button", { name: "Enregistrer mes informations" }).click();
  await expect(info.getByText("Informations enregistrées.")).toBeVisible();
  await page.reload();
  await expect(info.getByRole("radio", { name: "Fille ou femme" })).toHaveAttribute("aria-checked", "true");

  // The gender answer can be erased.
  await info.getByRole("button", { name: "Effacer ma réponse sur le sexe" }).click();
  await expect(info.getByText("Réponse sur le sexe effacée.")).toBeVisible();
  await page.reload();
  for (const name of [
    "Fille ou femme",
    "Garçon ou homme",
    "Non-binaire ou autre",
    "Je préfère ne pas répondre",
  ]) {
    await expect(info.getByRole("radio", { name })).toHaveAttribute("aria-checked", "false");
  }
});

test("onboarding: every question can be left empty, with the keyboard too, and Retour goes back", async ({
  page,
}) => {
  await newAccountBeforeOnboarding(page, "onbskip");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Arrow keys move the choice in the grid; Retour goes back to the school.
  const levels = page.getByRole("radiogroup", { name: "En quelle année es-tu ?" });
  await levels.getByRole("radio", { name: /Seconde/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(levels.getByRole("radio", { name: /Première/ })).toHaveAttribute("aria-checked", "true");
  await expect(levels.getByRole("radio", { name: /Première/ })).toBeFocused();
  await page.getByRole("button", { name: "Retour" }).click();
  await expect(page.getByRole("progressbar", { name: "Question 1 sur 3" })).toBeVisible();

  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page.getByRole("heading", { name: "Personnalise Revio" })).toHaveCount(0);

  await page.goto("/profil");
  const info = page.locator("#mes-informations");
  await expect(info.getByText("Aucune école choisie.")).toBeVisible();
  // The level chosen with the keyboard before going back was kept (Première), the gender was skipped.
  await expect(info.getByRole("radio", { name: /Première/ })).toHaveAttribute("aria-checked", "true");
  await expect(info.getByRole("radio", { name: "Je préfère ne pas répondre" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("onboarding: « Plus tard » skips everything and saves nothing", async ({ page }) => {
  await newAccountBeforeOnboarding(page, "onblater");
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: "Personnalise Revio" })).toHaveCount(0);
  await page.goto("/profil");
  const info = page.locator("#mes-informations");
  await expect(info.getByText("Aucune école choisie.")).toBeVisible();
  await expect(info.getByRole("radio", { checked: true })).toHaveCount(0);
});
