import { expect, test, type Page } from "@playwright/test";
import { skipOnboarding } from "./support/new-account";

const PAGES = [
  "/profil/trophees",
  "/profil/statistiques",
  "/social/classement",
  "/social/amis/00000000-0000-4000-8000-000000000002",
];

test.describe("anonymous visitor", () => {
  for (const path of PAGES) {
    test(`${path} sends to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/connexion/);
    });
  }
});

// Connected scenario: `npm run test:e2e:connected` (starts the fake Supabase server itself).
test.describe("links between the screens", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  async function signUpWithUsername(page: Page) {
    await page.goto("/connexion");
    await page.getByRole("button", { name: /Inscris-toi/ }).click();
    await page
      .getByLabel("E-mail")
      .fill(`nav-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
    await page.getByLabel("Mot de passe").fill("test-password-1");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/accueil/);
    await page.goto("/social");
    await page.getByLabel("Pseudo", { exact: true }).fill(`nav_${Math.random().toString(36).slice(2, 10)}`);
    await page.getByRole("button", { name: /^(Enregistrer|Continuer)$/ }).click();
    await skipOnboarding(page);
  }

  // Trophées, Statistiques and Classement read real data (Stan's PRs #48 to #50); the friend profile is still a sample.
  const CASES = [
    {
      from: "/profil",
      nav: "Trophées et statistiques",
      link: /^Trophées/,
      to: /\/profil\/trophees$/,
      title: "Trophées",
      mock: false,
    },
    {
      from: "/profil",
      nav: "Trophées et statistiques",
      link: /^Statistiques/,
      to: /\/profil\/statistiques$/,
      title: "Statistiques",
      mock: false,
    },
    {
      from: "/social",
      nav: "Classement et profil d'un ami",
      link: /^Classement/,
      to: /\/social\/classement$/,
      title: "Classement",
      mock: false,
    },
    {
      from: "/social",
      nav: "Classement et profil d'un ami",
      link: /^Exemple de profil d'ami/,
      to: /\/social\/amis\//,
      title: "Profil d'un ami",
      mock: true,
    },
  ];

  test("every page is reachable from its tab, with a named link of at least 44 px", async ({ page }) => {
    await signUpWithUsername(page);
    for (const c of CASES) {
      await page.goto(c.from);
      const link = page.getByRole("navigation", { name: c.nav }).getByRole("link", { name: c.link });
      await expect(link).toBeVisible();
      // Only a destination that still shows sample data is labelled so, before the link is followed.
      if (c.mock) await expect(link).toContainText("Données d'exemple");
      else await expect(link).not.toContainText("Données d'exemple");
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(page).toHaveURL(c.to);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(c.title));
    }
  });

  test("the links can be used with the keyboard", async ({ page }) => {
    await signUpWithUsername(page);
    await page.goto("/profil");
    const link = page
      .getByRole("navigation", { name: "Trophées et statistiques" })
      .getByRole("link", { name: /^Trophées/ });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/profil\/trophees$/);
  });
});
