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

// The interactive hero: six demo cards, full-screen demo views, orbits and their pause, and the pillar tabs.
test.describe("landing hero and demo views", () => {
  const CARDS = [
    { id: "progression-xp", name: /XP et niveau/, title: "XP et niveau" },
    { id: "serie", name: /^Série/, title: "Série" },
    { id: "trophees", name: /^Trophée/, title: "Trophées" },
    { id: "objectifs", name: /^Objectif du jour/, title: "Objectifs" },
    { id: "amis", name: /^Amis en révision/, title: "Amis en révision" },
    { id: "stats", name: /^Statistiques/, title: "Statistiques" },
  ];

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

  test("offers six demo cards as buttons with a meaningful name and a large target", async ({ page }) => {
    await page.goto("/");
    const list = page.getByRole("list", { name: "Aperçus de démonstration" });
    const buttons = list.getByRole("button");
    await expect(buttons).toHaveCount(6);
    for (const card of CARDS) {
      const button = list.getByRole("button", { name: card.name });
      await expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("a card opens its demo view with the keyboard; Escape closes it and gives the focus back", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // still grid: Playwright clicks only stable elements
    await page.goto("/");
    const card = page.getByRole("button", { name: /XP et niveau/ });
    await card.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "XP et niveau" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#progression-xp$/);
    await expect(dialog.getByText("Données d'exemple")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page).not.toHaveURL(/#progression-xp/);
    await expect(card).toBeFocused();
  });

  test("the browser Back button closes a demo view", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // still grid: Playwright clicks only stable elements
    await page.goto("/");
    await page.getByRole("button", { name: /^Série/ }).click();
    await expect(page.getByRole("dialog", { name: "Série" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).not.toHaveURL(/#serie/);
  });

  test("the Retour button closes a demo view", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // still grid: Playwright clicks only stable elements
    await page.goto("/");
    await page.getByRole("button", { name: /^Statistiques/ }).click();
    const dialog = page.getByRole("dialog", { name: "Statistiques" });
    await dialog.getByRole("button", { name: "Retour" }).click();
    await expect(dialog).toHaveCount(0);
  });

  for (const card of CARDS) {
    test(`/#${card.id} opens the "${card.title}" view directly and it is labelled as an example`, async ({
      page,
    }) => {
      await page.goto(`/#${card.id}`);
      const dialog = page.getByRole("dialog", { name: card.title });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Données d'exemple")).toBeVisible();
    });
  }

  test("the XP view shows the progress to Expert and the eight levels read from the engine", async ({
    page,
  }) => {
    await page.goto("/#progression-xp");
    const dialog = page.getByRole("dialog", { name: "XP et niveau" });
    await expect(dialog.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
    await expect(dialog).toContainText("il manque 720 XP pour atteindre Expert");
    await expect(dialog.getByRole("listitem").filter({ hasText: /XP$/ })).toHaveCount(8);
    await expect(dialog).toContainText("50 000 XP"); // Légende, from LEVELS
  });

  test("the streak view shows the record, the next milestone and a rest-day message without guilt", async ({
    page,
  }) => {
    await page.goto("/#serie");
    const dialog = page.getByRole("dialog", { name: "Série" });
    await expect(dialog).toContainText("Record : 24 jours");
    await expect(dialog).toContainText("Prochain palier : 21 jours");
    await expect(dialog).toContainText("Un jour de repos ne t'enlève jamais ton record");
  });

  test("the orbits move on a large screen, stop on hover, and can be paused", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const state = () =>
      page.evaluate(() => getComputedStyle(document.querySelector(".orbit-x")!).animationPlayState);
    const name = () =>
      page.evaluate(() => getComputedStyle(document.querySelector(".orbit-x")!).animationName);
    expect(await name()).toBe("orbit-x");
    expect(await state()).toBe("running");

    const pause = page.getByRole("button", { name: "Mettre le mouvement en pause" });
    await expect(pause).toBeVisible();
    await pause.click();
    await expect(page.getByRole("button", { name: "Relancer le mouvement" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await state()).toBe("paused");
    await page.getByRole("button", { name: "Relancer le mouvement" }).click();
    expect(await state()).toBe("running");

    // The pointer on a card stops the orbits, and the hovered card takes a violet border.
    const card = page.getByRole("button", { name: /^Statistiques/ });
    await card.hover({ force: true }); // the card is moving: no stability wait
    expect(await state()).toBe("paused");
    const border = await card.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(border).not.toBe("rgb(236, 236, 236)");

    // A card that is moving can still be clicked.
    await card.click({ force: true });
    await expect(page.getByRole("dialog", { name: "Statistiques" })).toBeVisible();
    await context.close();
  });

  test("with reduced motion the cards form a still grid and the pause button is gone", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("/");
    const animation = await page.evaluate(
      () => getComputedStyle(document.querySelector(".orbit-x")!).animationName,
    );
    expect(animation).toBe("none");
    await expect(page.getByRole("button", { name: /mouvement/ })).toHaveCount(0);
    const positions = await page.evaluate(() =>
      [...document.querySelectorAll(".orbit-card")].map((el) => getComputedStyle(el).position),
    );
    expect(positions.every((p) => p !== "absolute")).toBe(true);
    await context.close();
  });

  test("on a phone the cards form a grid and nothing moves", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto("/");
    const animation = await page.evaluate(
      () => getComputedStyle(document.querySelector(".orbit-x")!).animationName,
    );
    expect(animation).toBe("none");
    await expect(page.getByRole("button", { name: /mouvement/ })).toHaveCount(0);
    await expect(
      page.getByRole("list", { name: "Aperçus de démonstration" }).getByRole("button"),
    ).toHaveCount(6);
    await context.close();
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

  test("Créer mon compte and Se connecter, in the hero and the header, lead to the login page", async ({
    page,
  }) => {
    await page.goto("/");
    for (const name of ["Créer mon compte", "Se connecter", "Créer un compte"]) {
      const links = page.getByRole("link", { name });
      expect(await links.count(), name).toBeGreaterThan(0);
      for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
        expect(href, name).toBe("/connexion");
      }
    }
  });
});
