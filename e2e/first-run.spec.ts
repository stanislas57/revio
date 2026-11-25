import { expect, test, type Page } from "@playwright/test";

// A brand-new account (just after choosing a username) has no data: each tab explains what to do and
// offers one clear action. Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

async function newAccount(page: Page) {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`first-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByLabel("Pseudo").fill(`first_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toHaveCount(0);
}

test.describe("first run", () => {
  test("Accueil: no subject yet, the button leads to the subject form", async ({ page }) => {
    await newAccount(page);
    await page.goto("/accueil");
    await expect(page.getByText("Aucune matière pour l'instant")).toBeVisible();
    await page.getByRole("link", { name: "Ajouter ma première matière" }).click();
    await expect(page).toHaveURL(/\/accueil#ajouter-matiere$/);
    await expect(page.locator("#ajouter-matiere")).toContainText("Ajouter une matière"); // the anchor exists
    await expect(page.getByText("Ajouter une matière", { exact: true })).toBeInViewport();
    await expect(page.getByLabel("Matière", { exact: true })).toBeVisible();
  });

  test("Focus: no session yet, the button leads to the start form", async ({ page }) => {
    await newAccount(page);
    await page.goto("/focus");
    await expect(page.getByText("Aucune séance pour l'instant")).toBeVisible();
    await page.getByRole("link", { name: "Lance ta première séance" }).click();
    await expect(page).toHaveURL(/\/focus#nouvelle-seance$/);
    await expect(page.locator("#nouvelle-seance")).toContainText("Nouvelle séance");
    await expect(page.getByText("Nouvelle séance", { exact: true })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Démarrer" })).toBeVisible();
  });

  test("Social: no friend yet, the button leads to the friend search", async ({ page }) => {
    await newAccount(page);
    await page.goto("/social");
    await expect(page.getByText("Pas encore d'amis")).toBeVisible();
    await page.getByRole("link", { name: "Ajoute ton premier ami" }).click();
    await expect(page).toHaveURL(/\/social#ajouter-ami$/);
    await expect(page.locator("#ajouter-ami")).toContainText("Ajouter un ami");
    await expect(page.getByLabel("Pseudo de ton ami")).toBeInViewport();
  });

  test("Profil: no session yet, both buttons lead to the right pages", async ({ page }) => {
    await newAccount(page);
    await page.goto("/profil");
    await expect(page.getByText("Ta progression démarre avec ta première séance")).toBeVisible();
    // No made-up figure: everything is zero.
    await expect(page.getByText("Séances terminées").locator("xpath=following-sibling::dd")).toHaveText("0");

    await page.getByRole("link", { name: "Lance ta première séance" }).click();
    await expect(page).toHaveURL(/\/focus$/);
    await expect(page.getByRole("heading", { name: "Focus", level: 1 })).toBeVisible();

    await page.goto("/profil");
    await page.getByRole("link", { name: "Ajoute ton premier ami" }).click();
    await expect(page).toHaveURL(/\/social#ajouter-ami$/);
    await expect(page.getByLabel("Pseudo de ton ami")).toBeInViewport();
  });

  test("the empty states disappear once there is data", async ({ page }) => {
    await newAccount(page);
    await page.goto("/accueil");
    await page.getByLabel("Matière", { exact: true }).fill("Droit");
    await page.getByRole("button", { name: "Ajouter la matière" }).click();
    await expect(page.getByText("Droit").first()).toBeVisible();
    await expect(page.getByText("Aucune matière pour l'instant")).toHaveCount(0);

    await page.goto("/focus");
    await page.getByRole("button", { name: "Démarrer" }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    await page.getByRole("button", { name: "Terminer" }).click();
    await expect(page).toHaveURL(/\/focus\/seance\//);
    await page.goto("/focus");
    await expect(page.getByText("Aucune séance pour l'instant")).toHaveCount(0);
    await page.goto("/profil");
    await expect(page.getByText("Ta progression démarre avec ta première séance")).toHaveCount(0);
  });
});
