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

// The hero of the charter (no orbiting cards, no demo views) and the pillars grid.
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

  test("the pillars are a grid of five tiles, each with its status, labelled as examples", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator("#piliers");
    await section.scrollIntoViewIfNeeded();
    const tiles = section.getByRole("article");
    await expect(tiles).toHaveCount(5);
    for (const name of [
      "Comprendre ses notes",
      "Rester motivé · XP",
      "Rester motivé · Série",
      "Réviser avec ses amis",
      "S'organiser",
    ]) {
      await expect(section.getByRole("article", { name })).toBeVisible();
    }
    await expect(section.getByText("En construction", { exact: true })).toHaveCount(4);
    await expect(section.getByText("Bientôt", { exact: true })).toHaveCount(1);
    await expect(section.getByText("Données d'exemple")).toBeVisible();
    await expect(section).toContainText("convention Revio");
  });

  test("each tile reacts to its own buttons", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // final states at once: no timing in this test
    await page.goto("/");
    const section = page.locator("#piliers");
    await section.scrollIntoViewIfNeeded();

    // Notes: the next grade in Droit moves the overall average (computed by the academic engine).
    const notes = section.getByRole("article", { name: "Comprendre ses notes" });
    await expect(notes).toContainText("13,72 → 14,06");
    await notes.getByRole("button", { name: "Monter la note d'un point" }).click();
    await expect(notes).toContainText("13,72 → 14,17");

    // XP: a 25-minute session gives +25 XP, in lime.
    const xp = section.getByRole("article", { name: "Rester motivé · XP" });
    await xp.getByRole("button", { name: "Terminer une séance de 25 min" }).click();
    await expect(xp.getByText("+25 XP", { exact: true })).toBeVisible();
    await expect(xp).toContainText(/4\s305 XP/);

    // Streak: validating today makes 15 days, once.
    const streak = section.getByRole("article", { name: "Rester motivé · Série" });
    await streak.getByRole("button", { name: /Valider aujourd'hui/ }).click();
    await expect(streak).toContainText("15 jours");
    await expect(streak.getByRole("button", { name: "Aujourd'hui validé" })).toBeDisabled();

    // Friends: one bravo per friend, no counter.
    const friends = section.getByRole("article", { name: "Réviser avec ses amis" });
    await friends.getByRole("button", { name: "Bravo à Léa" }).click();
    await expect(friends.getByRole("button", { name: "Envoyé à Léa" })).toBeDisabled();

    // Organiser: a session is a toggle button.
    const plan = section.getByRole("article", { name: "S'organiser" });
    const wednesday = plan.getByRole("button", { name: /Mer/ });
    await expect(wednesday).toHaveAttribute("aria-pressed", "false");
    await wednesday.click();
    await expect(wednesday).toHaveAttribute("aria-pressed", "true");
    await expect(plan).toContainText("2 séances sur 3 cette semaine");
  });

  test("the grid comes alive once in view: the streak lights up and friends start studying", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator("#piliers");
    await section.scrollIntoViewIfNeeded();
    const streak = section.getByRole("article", { name: "Rester motivé · Série" });
    await expect(streak.locator('li[aria-label$=": validé"]')).toHaveCount(6, { timeout: 5000 });
    const friends = section.getByRole("article", { name: "Réviser avec ses amis" });
    await expect(friends.getByText(/^En révision/)).toHaveCount(3, { timeout: 5000 });
  });

  test("with reduced motion the final state is shown at once and nothing loops", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const section = page.locator("#piliers");
    await section.scrollIntoViewIfNeeded();
    const streak = section.getByRole("article", { name: "Rester motivé · Série" });
    await expect(streak.locator('li[aria-label$=": validé"]')).toHaveCount(6, { timeout: 500 });
    await expect(
      section.getByRole("article", { name: "Réviser avec ses amis" }).getByText(/^En révision/),
    ).toHaveCount(3, { timeout: 500 });
    await expect(section.getByRole("article", { name: "Rester motivé · XP" })).toContainText(/4\s280 XP/);
    const looping = await section.evaluate(
      (node) =>
        node
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length,
    );
    expect(looping).toBe(0);
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
