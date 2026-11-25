import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Connected scenario (fake Supabase server): see docs/E2E.md. Skipped without E2E_CONNECTED.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

async function signUp(page: import("@playwright/test").Page, tag: string) {
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByLabel("Pseudo").fill(`${tag}_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Choisis ton pseudo" })).toHaveCount(0);
  return email;
}

test("privacy settings: sharing by default and live status are saved and applied", async ({ page }) => {
  await signUp(page, "priv15");
  await page.goto("/focus");
  await expect(page.getByLabel(/Partager avec mes amis/)).toBeChecked();

  await page.goto("/profil#reglages");
  await page.getByLabel("Partager mes séances par défaut").uncheck();
  await page.getByLabel("Montrer « en révision » à mes amis").uncheck();
  await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
  await expect(page.getByText("Réglages enregistrés.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Partager mes séances par défaut")).not.toBeChecked();
  await expect(page.getByLabel("Montrer « en révision » à mes amis")).not.toBeChecked();

  // The Focus start form follows the default: not shared unless the user ticks the box.
  await page.goto("/focus");
  await expect(page.getByLabel(/Partager avec mes amis/)).not.toBeChecked();
});

test("export contains only my data, then deleting the account removes it", async ({ page }) => {
  const email = await signUp(page, "acct14");
  await page.getByLabel("Matière", { exact: true }).fill("Maths");
  await page.getByLabel("Coefficient").fill("3");
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.locator("[data-slot=card]", { hasText: "Maths" }).first()).toBeVisible();

  await page.goto("/profil");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Exporter mes données" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^revio-export-\d{4}-\d{2}-\d{2}\.json$/);
  const doc = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(doc.format).toBe("revio-export");
  expect(doc.account.email).toBe(email);
  expect(doc.data.subjects).toHaveLength(1);
  expect(doc.data.subjects[0].name).toBe("Maths");
  expect(doc.data.profile).toHaveLength(1);
  expect(doc.data.friendships).toEqual([]);
  expect(JSON.stringify(doc)).not.toMatch(/password|token/i);

  // Deletion needs the typed word.
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  const confirm = page.getByRole("button", { name: "Supprimer définitivement" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Pour confirmer, tape SUPPRIMER/).fill("oui");
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Pour confirmer, tape SUPPRIMER/).fill("supprimer");
  await confirm.click();

  await expect(page).toHaveURL(/\/connexion\?compte=supprime/);
  await expect(page.getByText(/Ton compte et toutes tes données ont été supprimés/)).toBeVisible();

  // Signed out, and the credentials no longer work.
  await page.goto("/profil");
  await expect(page).toHaveURL(/\/connexion/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole("alert")).toBeVisible();
});
