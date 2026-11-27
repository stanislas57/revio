import { expect, type Page } from "@playwright/test";

/**
 * Adds a subject on « Importer · ajouter » and checks it on « Mes notes » (where its card is). Waits for the form
 * to be emptied (the sign that the server accepted it) before leaving the page.
 */
export async function addSubject(page: Page, name: string, coefficient?: string): Promise<void> {
  await page.goto("/notes/importer#ajouter-matiere");
  await page.getByLabel("Matière", { exact: true }).fill(name);
  if (coefficient) await page.getByLabel("Coefficient").fill(coefficient);
  await page.getByRole("button", { name: "Ajouter la matière" }).click();
  await expect(page.getByLabel("Matière", { exact: true })).toHaveValue("");
  await page.goto("/notes");
  await expect(page.locator("[data-slot=card]", { hasText: name }).first()).toBeVisible();
}
