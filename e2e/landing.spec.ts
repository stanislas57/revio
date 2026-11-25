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
    await page.getByRole("link", { name: "Rejoindre la bêta" }).first().click();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("Explorer la démo leads to the public demo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Explorer la démo" }).click();
    await expect(page).toHaveURL(/\/demo$/);
  });

  test("FAQ answers open with the keyboard", async ({ page }) => {
    await page.goto("/");
    const first = page.locator("details").first();
    await first.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("open", "");
  });
});

// The hero of the charter (no orbiting cards, no demo views) and the pillar tabs.
test.describe("landing hero", () => {
  for (const width of [375, 768, 1024, 1440]) {
    test(`does not scroll horizontally at ${width}px, light and dark`, async ({ browser }) => {
      for (const colorScheme of ["light", "dark"] as const) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme });
        const page = await context.newPage();
        await page.goto("/");
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
        });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${width}px ${colorScheme}`).toBe(0);
        await context.close();
      }
    });
  }

  test("shows the charter's pill, title, subtitle, both buttons and the loop band", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("section", { has: page.getByRole("heading", { level: 1 }) });
    await expect(hero.getByText("La nouvelle façon de réviser")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Moins de stress\.\s*Plus de progrès\./);
    await expect(
      hero.getByText("Organise tes révisions, gagne de l'XP et progresse avec tes amis."),
    ).toBeVisible();
    await expect(hero.getByRole("link", { name: "Rejoindre la bêta" })).toHaveAttribute("href", "/connexion");
    await expect(hero.getByRole("link", { name: "Explorer la démo" })).toHaveAttribute("href", "/demo");
    await expect(page.getByRole("list", { name: "La boucle de Revio" }).getByRole("listitem")).toHaveText([
      // The ✦ separators are decorative (aria-hidden) but part of the text content.
      /^Planifie✦?$/,
      /^Révise✦?$/,
      /^Gagne de l'XP✦?$/,
      /^Recommence$/,
    ]);
  });

  test("has no orbiting cards, no pause button and no demo view", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Aperçus de démonstration" })).toHaveCount(0);
    await expect(page.locator(".orbit-card, .orbit-x, .orbit-stage")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /mouvement/ })).toHaveCount(0);
    await expect(page.getByText("Les cartes ci-dessus sont des exemples")).toHaveCount(0);
    // The former deep links of the demo views open nothing any more.
    await page.goto("/#serie");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("nothing in the hero moves: no running animation once loaded", async ({ page }) => {
    await page.goto("/");
    const running = await page
      .locator("section", { has: page.getByRole("heading", { level: 1 }) })
      .evaluate(
        (hero) =>
          hero
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length,
      );
    expect(running).toBe(0);
  });

  test("the four pillars are vertical tabs moved with the arrow keys, each with an example", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#piliers").scrollIntoViewIfNeeded();
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(4);
    await expect(page.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    const panel = page.getByRole("tabpanel");
    await expect(panel).toContainText("S'organiser");
    await expect(panel.getByText("Données d'exemple")).toBeVisible();
    await page.keyboard.press("End");
    await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
    await expect(panel).toContainText("Rester motivé");
  });

  test("the session preview ends on +115 XP (65 min + the daily goal) and the offer shows no price", async ({
    page,
  }) => {
    await page.goto("/");
    const preview = page.locator("#apercu");
    await preview.scrollIntoViewIfNeeded();
    await expect(preview.getByLabel("+115")).toBeVisible();
    await expect(preview).toContainText("65 min de révision : +65 XP");
    await expect(preview).toContainText("Objectif du jour atteint : +50 XP");
    await expect(page.locator("#offre")).toContainText("Envisagé");
  });

  test("Rejoindre la bêta, Accès bêta and Se connecter lead to the login page", async ({ page }) => {
    await page.goto("/");
    for (const name of ["Rejoindre la bêta", "Se connecter", "Accès bêta"]) {
      const links = page.getByRole("link", { name });
      expect(await links.count(), name).toBeGreaterThan(0);
      for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
        expect(href, name).toBe("/connexion");
      }
    }
  });
});
