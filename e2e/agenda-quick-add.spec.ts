import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario (fake Supabase server): `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("agenda: add a revision with buttons only, nothing typed", async ({ page }) => {
  await newAccount(page, "quick");
  await page.goto("/agenda");

  // A subject to pick (created in the academic module).
  await page.goto("/accueil");
  await page.getByLabel("Matière", { exact: true }).fill("Droit");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.getByText("Droit").first()).toBeVisible();

  await page.goto("/agenda");
  const quick = page.locator("#ajouter");
  const next = quick.getByRole("button", { name: "Continuer" });
  await expect(next).toBeDisabled();

  // 1. Type
  await quick.getByRole("radio", { name: /Révision/ }).click();
  await expect(quick.getByRole("radio", { name: /Révision/ })).toHaveAttribute("aria-checked", "true");
  await next.click();
  // 2. Subject
  await expect(quick.getByRole("progressbar", { name: "Étape 2 sur 5" })).toBeVisible();
  await quick.getByRole("radio", { name: "Droit" }).click();
  await next.click();
  // 3. Day
  await quick.getByRole("radio", { name: /Demain/ }).click();
  await next.click();
  // 4. Time and duration
  await quick.getByRole("radio", { name: "18 h" }).click();
  await quick.getByRole("radio", { name: "45 min" }).click();
  await next.click();
  // 5. Recap, then add
  await expect(quick.getByText("Révision · Droit")).toBeVisible();
  await expect(quick.getByText("18 h 00")).toBeVisible();
  await expect(quick.getByText("18 h 45")).toBeVisible();
  await quick.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(quick.getByText("Ajouté à ton agenda !")).toBeVisible();

  // It is on the home page, in the upcoming events, and in the agenda.
  await page.goto("/accueil");
  await expect(page.getByRole("heading", { name: "Prochains événements" }).locator("..")).toContainText(
    "Révision · Droit",
  );
});

test("agenda: Retour goes back, a break asks no subject and an exam no time", async ({ page }) => {
  await newAccount(page, "quick2");
  await page.goto("/agenda");
  const quick = page.locator("#ajouter");
  const next = quick.getByRole("button", { name: "Continuer" });

  // Pause: type → day → time → recap (no subject step).
  await quick.getByRole("radio", { name: /Pause/ }).click();
  await next.click();
  await expect(quick.getByRole("radio", { name: /Aujourd'hui/ })).toBeVisible();
  await quick.getByRole("button", { name: "Retour" }).click();
  await expect(quick.getByRole("radio", { name: /Pause/ })).toHaveAttribute("aria-checked", "true");

  // Exam: asks a subject (or "Autre"), a day, then goes straight to the recap: no time, no duration.
  await quick.getByRole("radio", { name: /Examen/ }).click();
  await next.click();
  await quick.getByRole("radio", { name: "Autre" }).click();
  await quick.getByRole("radio", { name: "Révisions générales" }).click();
  await next.click();
  await quick.getByRole("radio", { name: /Après-demain/ }).click();
  await next.click();
  await expect(quick.locator("dd", { hasText: "toute la journée" })).toBeVisible();
  await quick.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(quick.getByText("Ajouté à ton agenda !")).toBeVisible();
});
