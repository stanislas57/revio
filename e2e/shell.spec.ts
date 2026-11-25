import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The app shell of the Revio design: the ink sidebar from 768 px, the floating dock below.
// Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test.describe("desktop sidebar", () => {
  test("lists the five tabs, marks the current one, and shows the real profile card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const username = await newAccount(page, "shell");
    await page.goto("/social");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Accueil", "Agenda", "Focus", "Social", "Profil"]);
    await expect(nav.locator('a[aria-current="page"]')).toHaveText("Social");

    // The profile card is the user's own: username and level 1 (a new account), with the XP bar.
    const aside = page.getByRole("complementary");
    await expect(aside.getByText(username)).toBeVisible();
    await expect(aside.getByText("Niv. 1")).toBeVisible();
    await expect(aside.getByRole("progressbar", { name: /Niveau 1/ })).toBeVisible();

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
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).locator('a[aria-current="page"]'),
    ).toHaveText("Focus");
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
      .getByRole("link", { name: "Profil" });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/profil$/);
  });
});

test.describe("mobile dock", () => {
  test("shows four tabs and the raised Réviser button, no sidebar, the right tab marked", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await newAccount(page, "dock");
    await page.goto("/social");
    await expect(page.getByRole("complementary")).toBeHidden();
    const dock = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("link")).toHaveText(["Accueil", "Agenda", "Réviser", "Social", "Profil"]);
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
    await dock.getByRole("link", { name: "Profil" }).click();
    await expect(page).toHaveURL(/\/profil$/);
    await dock.getByRole("link", { name: "Réviser" }).click();
    await expect(page).toHaveURL(/\/focus$/);
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Réviser" }),
    ).toHaveAttribute("aria-current", "page");
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
