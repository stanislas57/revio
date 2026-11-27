import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The app shell of the charter: the white sidebar from 768 px, the bottom bar below.
// Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test.describe("desktop sidebar", () => {
  test("lists the four entries, marks the current one, and shows the real profile card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const username = await newAccount(page, "shell");
    await page.goto("/social");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Accueil", "Social", "Notes", "Agenda"]);
    await expect(nav.locator('a[aria-current="page"]')).toHaveText("Social");
    // A sub-page belongs to its entry.
    await page.goto("/social/classement");
    await expect(nav.locator('a[aria-current="page"]')).toHaveText("Social");
    await page.goto("/social");

    // The profile card is the user's own: username and level 1 (a new account), with the XP bar.
    const aside = page.getByRole("complementary");
    await expect(aside.getByText(username)).toBeVisible();
    await expect(aside.getByText("Niv. 1")).toBeVisible();
    await expect(aside.getByRole("progressbar", { name: /Niveau 1/ })).toBeVisible();
    // The profile has no entry of its own: the card leads to it.
    await aside.getByRole("link", { name: /Mon profil/ }).click();
    await expect(page).toHaveURL(/\/profil$/);
    await page.goto("/social");

    // Every control of the sidebar is at least 44 px high.
    const small = await aside.locator("a, button").evaluateAll((els) =>
      els
        .map((e) => ({
          name: (e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 30),
          h: Math.round(e.getBoundingClientRect().height),
        }))
        .filter((x) => x.h < 43.5),
    );
    expect(small).toEqual([]);
  });

  test("the revise button leads to Focus and is marked as the current page there", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await newAccount(page, "shell");
    await page.goto("/profil");
    await page.getByRole("link", { name: "Réviser maintenant" }).click();
    await expect(page).toHaveURL(/\/focus$/);
    await expect(page.getByRole("link", { name: "Réviser maintenant" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Focus has no entry in the menu: the revise button is the one marked.
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).locator('a[aria-current="page"]'),
    ).toHaveCount(0);
  });

  test("Notes shows its sub-pages while it is the current entry, and marks the current one", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await newAccount(page, "shell");
    await page.goto("/accueil");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link", { name: "Répartir mon temps" })).toHaveCount(0);

    await page.goto("/notes/temps");
    await expect(nav.getByRole("link")).toHaveText([
      "Accueil",
      "Social",
      "Notes",
      "Mes notes",
      "Simulateur & scénarios",
      "Répartir mon temps",
      "Importer · ajouter",
      "Agenda",
    ]);
    await expect(nav.locator('a[aria-current="page"]')).toHaveText(["Notes", "Répartir mon temps"]);
    await nav.getByRole("link", { name: "Simulateur & scénarios" }).click();
    await expect(page).toHaveURL(/\/notes\/simulateur$/);
    await expect(page.getByRole("heading", { name: "Simulateur" })).toBeVisible();
  });

  test("sign out and the theme switch are in the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await newAccount(page, "shell");
    await page.goto("/accueil");
    const aside = page.getByRole("complementary");
    await aside.getByRole("button", { name: /mode sombre/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await aside.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/(connexion|$)/);
  });

  test("the sidebar can be used with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await newAccount(page, "shell");
    await page.goto("/accueil");
    const link = page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Notes", exact: true });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/notes$/);
  });
});

test.describe("mobile dock", () => {
  test("the bottom bar shows the four entries and the raised Réviser button, no sidebar, the right tab marked", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await newAccount(page, "dock");
    await page.goto("/social");
    await expect(page.getByRole("complementary")).toBeHidden();
    const dock = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("link")).toHaveText(["Accueil", "Social", "Réviser", "Notes", "Agenda"]);
    await expect(dock.locator('a[aria-current="page"]')).toHaveText("Social");
    const small = await dock
      .locator("a")
      .evaluateAll((els) =>
        els
          .map((e) => ({ t: e.textContent, h: Math.round(e.getBoundingClientRect().height) }))
          .filter((x) => x.h < 43.5),
      );
    expect(small).toEqual([]);
  });

  test("a tab navigates, Réviser opens Focus and is marked there", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await newAccount(page, "dock");
    await page.goto("/accueil");
    const dock = page.getByRole("navigation", { name: "Navigation principale" });
    await dock.getByRole("link", { name: "Notes" }).click();
    await expect(page).toHaveURL(/\/notes$/);
    await dock.getByRole("link", { name: "Réviser" }).click();
    await expect(page).toHaveURL(/\/focus$/);
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Réviser" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("the header avatar leads to the profile, which has no tab", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await newAccount(page, "dock");
    await page.goto("/accueil");
    await page
      .getByRole("banner")
      .getByRole("link", { name: /Mon profil/ })
      .click();
    await expect(page).toHaveURL(/\/profil$/);
  });

  test("the dock never hides the end of a page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await newAccount(page, "dock");
    await page.goto("/profil");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const dockTop = await page
      .getByRole("navigation", { name: "Navigation principale" })
      .evaluate((n) => n.getBoundingClientRect().top);
    const lastBottom = await page
      .locator("main > *")
      .last()
      .evaluate((n) => n.getBoundingClientRect().bottom);
    expect(lastBottom).toBeLessThanOrEqual(dockTop + 1);
  });
});
