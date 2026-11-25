import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

const PAGES = [
  "/apercu",
  "/apercu/accueil",
  "/apercu/fil",
  "/apercu/fiches",
  "/apercu/progression",
  "/apercu/focus",
];

test.describe("anonymous visitor", () => {
  for (const path of PAGES) {
    test(`${path} sends to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/connexion/);
      await expect(page.getByText("Pas encore disponible")).toHaveCount(0);
    });
  }
});

// Connected scenario: `npm run test:e2e:connected`.
test.describe("preview screens (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("the index lists the five screens and says they are not real", async ({ page }) => {
    await newAccount(page, "prev");
    await page.goto("/apercu");
    await expect(page.getByRole("note")).toContainText("Pas encore disponible");
    await expect(page.getByText("Données d'exemple").first()).toBeVisible();
    await expect(page.getByRole("main").getByRole("link")).toHaveCount(5);
  });

  for (const path of PAGES.slice(1)) {
    test(`${path}: marked as a mock-up, no overflow, nothing pretends to work`, async ({ page }) => {
      await newAccount(page, "prev");
      await page.goto(path);
      await expect(page.getByRole("note")).toContainText("Pas encore disponible");
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toContainText("Aperçu");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
      // The buttons that would need the missing feature are disabled.
      for (const name of ["Reprendre", "Défier Sarah", "Rejoindre", "Commencer"]) {
        const button = page.getByRole("button", { name, exact: true });
        if ((await button.count()) > 0) await expect(button.first()).toBeDisabled();
      }
    });
  }

  test("the feed tabs move with the arrow keys and the other tabs say 'bientôt'", async ({ page }) => {
    await newAccount(page, "prev");
    await page.goto("/apercu/fil");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("bientôt");
  });

  test("kudos on the preview home: once, announced, no public counter", async ({ page }) => {
    await newAccount(page, "prev");
    await page.goto("/apercu/accueil");
    await page.getByRole("button", { name: /^Kudos à Léo/ }).click();
    await expect(page.getByRole("button", { name: /Kudos envoyé à Léo/ })).toBeDisabled();
    expect(await page.locator("main").innerText()).not.toMatch(/\d+\s*kudos(?! de la semaine)/i);
  });

  test("the preview screens are not in the navigation", async ({ page }) => {
    await newAccount(page, "prev");
    await page.goto("/accueil");
    await expect(page.getByRole("link", { name: /Aperçu/ })).toHaveCount(0);
  });
});
