import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario (fake Supabase server): `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

/** Tomorrow as YYYY-MM-DD in Paris (the default time zone of a new account). */
function tomorrowInParis(): string {
  const d = new Date(Date.now() + 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
}

test("home: the landing's slogan, then organic cards that lead to their pages", async ({ page }) => {
  const username = await newAccount(page, "home");
  await page.goto("/accueil");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Moins de stress\.\s*Plus de progrès\./);
  await expect(page.getByText(`Accueil · Salut, ${username} !`)).toBeVisible();

  // The cards of the dashboard, each one link (one tab stop) to its page.
  for (const [name, url] of [
    ["Voir tous les niveaux", /\/profil#niveaux$/],
    ["Voir ma série", /\/profil$/],
    ["Voir mes statistiques", /\/profil\/statistiques$/],
    ["Voir mes amis", /\/social$/],
    ["Voir mon agenda", /\/agenda$/],
  ] as const) {
    await page.goto("/accueil");
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }

  await page.goto("/accueil");
  await expect(page.getByText("Niveau 1 · Novice")).toBeVisible();
  await expect(page.getByText("Lance ta première séance Focus.")).toBeVisible();
  await expect(page.getByText("Ajoute ton premier ami.")).toBeVisible();
  await expect(page.getByText("Rien de prévu dans les deux semaines.")).toBeVisible();
});

test("home: the next agenda item appears in « Prochains événements »", async ({ page }) => {
  await newAccount(page, "homeagenda");
  await page.goto("/agenda");
  await page.getByLabel("Titre").fill("Révision de chimie");
  await page.getByLabel("Date").fill(tomorrowInParis());
  await page.getByLabel("Début").fill("18:00");
  await page.getByLabel("Fin").fill("19:00");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  await expect(page.getByText("Révision de chimie").first()).toBeVisible();

  await page.goto("/accueil");
  const upcoming = page.getByRole("heading", { name: "Prochains événements" }).locator("..");
  await expect(upcoming).toContainText("Révision de chimie");
  await expect(upcoming).toContainText("Demain · 18 h 00 · Révision");
});
