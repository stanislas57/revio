import { expect, test, type Page } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

// Main demo journey (docs/DEMO.md) on the local fake Supabase. Skipped otherwise.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const rand = () => Math.random().toString(36).slice(2, 9);

async function signUpWithUsername(page: Page, username: string) {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page.getByLabel("E-mail").fill(`demo-${Date.now()}-${rand()}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  // The username screen replaces the app until a username is chosen.
  await page.getByLabel("Pseudo").fill(username);
  await page.getByRole("button", { name: "Continuer" }).click();
  await skipOnboarding(page);
  await page.goto("/social");
  await expect(page.getByText("Ajouter un ami")).toBeVisible();
}

test("demo journey: friends, live study, private grades", async ({ browser }) => {
  const alice = `alice_${rand()}`;
  const bob = `bob_${rand()}`;
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await signUpWithUsername(a, alice);
  await signUpWithUsername(b, bob);

  // Alice has a private grade.
  await a.goto("/accueil");
  await a.getByLabel("Matière", { exact: true }).fill("Droit secret");
  await a.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(a.getByText("Droit secret").first()).toBeVisible();

  // Friend request from Alice, accepted by Bob.
  await a.goto("/social");
  await a.getByLabel("Pseudo de ton ami").fill(bob);
  await a.getByRole("button", { name: "Rechercher" }).click();
  await a.getByRole("button", { name: "Ajouter", exact: true }).click();
  // Wait for the request to be recorded before Bob looks for it.
  await expect(a.getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(0);
  await b.goto("/social");
  await b.getByRole("button", { name: "Accepter" }).click();
  await expect(b.getByText(alice).first()).toBeVisible();

  // Alice studies; Bob sees her live.
  await a.goto("/focus");
  await a.getByRole("button", { name: "Démarrer" }).click();
  await expect(a.getByLabel("Séance en cours")).toBeVisible();
  await b.goto("/social");
  await expect(b.getByText("1 ami révise en ce moment")).toBeVisible();

  // Alice finishes: a result is shown (too short for XP, which is the honest case).
  await a.getByRole("button", { name: "Terminer" }).click();
  await expect(a).toHaveURL(/\/focus\/seance\//);
  await b.goto("/social");
  await expect(b.getByText("Aucun ami ne révise en ce moment.")).toBeVisible();

  // Grades and subjects never leak to a friend.
  for (const path of ["/social", "/profil", `/social/amis`]) {
    await b.goto(path);
    await expect(b.getByText("Droit secret")).toHaveCount(0);
  }
});
