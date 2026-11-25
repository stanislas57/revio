import { expect, test } from "@playwright/test";

// Public landing page: structure, honesty of the content and no horizontal scroll.
test.describe("landing page", () => {
  test("has its sections and a single main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const name of [
      /quatre idées/i,
      /à quoi ça ressemble/i,
      /gratuit pour commencer/i,
      /questions fréquentes/i,
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  test("does not scroll horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test("never shows a price, a user count or a testimonial", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/\d\s?€|€\s?\d|\/\s?mois|\/\s?an\b/);
    expect(text).not.toMatch(/\d+\s*(étudiants|utilisateurs|users)/);
    expect(text).not.toContain("témoignage");
  });

  test("account buttons lead to the login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Créer mon compte" }).first().click();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("FAQ answers open with the keyboard", async ({ page }) => {
    await page.goto("/");
    const first = page.locator("details").first();
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("open", "");
  });
});
