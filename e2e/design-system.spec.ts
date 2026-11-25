import { expect, test, type Page } from "@playwright/test";

// The public showcase of components/revio/ (sample data, no backend): structure, keyboard, anti-pressure rules,
// reduced motion and touch targets.
const SECTIONS = [
  "anneau",
  "presence",
  "xp",
  "serie",
  "quetes",
  "kudos",
  "fiches",
  "direct",
  "ligue",
  "binome",
  "cartes",
  "focus",
  "matieres",
  "badges",
  "navigation",
];

const confettiCanvases = (page: Page) =>
  page.evaluate(() => document.querySelectorAll("body > canvas").length);

test.describe("design system page", () => {
  test("lists every component, is not indexed and never scrolls horizontally", async ({ page }) => {
    await page.goto("/design-system");
    await expect(page.getByRole("heading", { level: 1, name: "Design system Revio" })).toBeVisible();
    for (const id of SECTIONS) await expect(page.locator(`#${id}`)).toBeAttached();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("Données d'exemple").first()).toBeVisible();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px`).toBe(0);
    }
  });

  test("the rings expose their value to screen readers", async ({ page }) => {
    await page.goto("/design-system");
    const ring = page.locator("#anneau").getByRole("progressbar", { name: "Progression du chapitre" });
    await expect(ring).toHaveAttribute("aria-valuenow", "64");
    await expect(page.locator("#anneau").getByRole("progressbar")).toHaveCount(3); // the presence ring is decorative
  });

  test("every button and link is at least 44 px high", async ({ page }) => {
    await page.goto("/design-system");
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main a, main button")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
        })
        .map((el) => ({
          name: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40),
          h: Math.round(el.getBoundingClientRect().height),
        }))
        .filter((x) => x.h < 43.5),
    );
    expect(small).toEqual([]);
  });

  test("quests: completing the last one opens the chest with confetti, once per day", async ({ page }) => {
    await page.goto("/design-system");
    const quests = page.locator("#quetes");
    expect(await confettiCanvases(page)).toBe(0);
    await quests.getByRole("checkbox", { name: "2 sessions focus de 25 min" }).click();
    await quests.getByRole("checkbox", { name: "Envoyer un kudos à un ami" }).click();
    await expect.poll(() => confettiCanvases(page)).toBeGreaterThan(0);
    const claimed = await page.evaluate(() => localStorage.getItem("revio:once:quest-chest"));
    expect(claimed).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Undo and redo the last quest: the celebration does NOT play again today.
    await page.evaluate(() => document.querySelectorAll("body > canvas").forEach((c) => c.remove()));
    await quests.getByRole("checkbox", { name: "Envoyer un kudos à un ami" }).click();
    await quests.getByRole("checkbox", { name: "Envoyer un kudos à un ami" }).click();
    await page.waitForTimeout(400);
    expect(await confettiCanvases(page)).toBe(0);
  });

  test("with reduced motion the celebration does not play at all", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design-system");
    const quests = page.locator("#quetes");
    await quests.getByRole("checkbox", { name: "2 sessions focus de 25 min" }).click();
    await quests.getByRole("checkbox", { name: "Envoyer un kudos à un ami" }).click();
    await page.waitForTimeout(500);
    expect(await confettiCanvases(page)).toBe(0);
  });

  test("kudos: one per day and per friend, announced, and no public counter", async ({ page }) => {
    await page.goto("/design-system");
    const section = page.locator("#kudos");
    const first = section.getByRole("button", { name: /^Kudos à Léo/ });
    await first.click();
    await expect(section.getByRole("button", { name: /Kudos envoyé à Léo/ })).toBeDisabled();
    await expect(section.getByRole("status").filter({ hasText: "Un seul par jour" })).toHaveText(
      /Kudos envoyé à Léo/,
    );
    await expect(section.getByRole("button", { name: /^Kudos à Sarah/ })).toBeEnabled(); // another friend: allowed
    expect(await page.locator("body").innerText()).not.toMatch(/\d+\s*kudos/i);
  });

  test("reactions: open and choose with the keyboard, Escape closes and gives the focus back", async ({
    page,
  }) => {
    await page.goto("/design-system");
    const trigger = page.locator("#kudos").getByRole("button", { name: "Réagir" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const group = page.getByRole("group", { name: "Choisir une réaction" });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button")).toHaveCount(4);
    await expect(group.getByRole("button").first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(group).toHaveCount(0);
    await expect(page.locator("#kudos").getByRole("button", { name: /Ta réaction : Éclair/ })).toBeVisible();

    await page
      .locator("#kudos")
      .getByRole("button", { name: /Ta réaction/ })
      .focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(group).toHaveCount(0);
    await expect(page.locator("#kudos").getByRole("button", { name: /Ta réaction/ })).toBeFocused();
  });

  test("flashcards: flip with the keyboard, two equivalent buttons, a swipe does the same", async ({
    page,
  }) => {
    await page.goto("/design-system");
    const section = page.locator("#cartes");
    const card = section.getByRole("button", { name: /Retourner la carte/ });
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(section.getByRole("button", { name: /Voir la question/ })).toBeVisible();

    await expect(section.getByText("Verdicts donnés : 0")).toBeVisible();
    await section.getByRole("button", { name: "À revoir" }).click(); // goes to the end of the stack
    await section.getByRole("button", { name: "Je sais" }).click();
    await expect(section.getByText("Verdicts donnés : 2")).toBeVisible();

    // Swipe right on the top card = "Je sais".
    const box = (await section.getByRole("button", { name: /Retourner la carte/ }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(section.getByText("Verdicts donnés : 3")).toBeVisible();

    // Finish the stack: 2 cards left ("À revoir" put one back at the end, so it is still there).
    await section.getByRole("button", { name: "Je sais" }).click();
    await section.getByRole("button", { name: "Je sais" }).click();
    await expect(section.getByText("Pile terminée")).toBeVisible();
  });

  test("league: the gain re-orders the table and the user's row says how many places were gained", async ({
    page,
  }) => {
    await page.goto("/design-system");
    const section = page.locator("#ligue");
    await expect(section.getByRole("listitem", { name: /^3, toi/ })).toBeVisible();
    await section.getByRole("button", { name: "Gagner 120 XP" }).click();
    await expect(
      section.getByRole("listitem", { name: /^2, toi, 2 040 XP, monté de 1 place/ }),
    ).toBeVisible();
    await expect(section.getByRole("listitem", { name: /toi/ })).toHaveAttribute("aria-current", "true");
    expect(await section.getByRole("listitem").count()).toBeGreaterThanOrEqual(28);
  });

  test("live feed: three entries at most, the newest at the bottom", async ({ page }) => {
    await page.goto("/design-system");
    const feed = page.locator("#direct");
    await expect(feed.getByRole("listitem")).toHaveCount(3);
    await feed.getByRole("button", { name: "Ajouter une activité" }).click();
    await feed.getByRole("button", { name: "Ajouter une activité" }).click();
    await expect(feed.getByRole("listitem")).toHaveCount(3);
    await expect(feed.getByRole("listitem").last()).toContainText(/Sarah|Nour|Léo/);
  });

  test("navigation: the active tab is marked and the revise button leads to Focus", async ({ page }) => {
    await page.goto("/design-system");
    const nav = page.locator("#navigation");
    await expect(nav.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(2);
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(2); // one in the sidebar, one in the dock
    await expect(nav.getByRole("link", { name: /Réviser/ })).toHaveCount(2);
    await expect(nav.getByRole("link", { name: "Fil social 3 nouveaux" })).toBeVisible(); // the badge is read, not only seen
  });

  test("focus timer: the label morphs between Focus and Pause and the timer is named", async ({ page }) => {
    await page.goto("/design-system");
    const focus = page.locator("#focus");
    await expect(focus.getByRole("timer")).toHaveAttribute("aria-label", /07:24 sur 25:00/);
    await focus.getByRole("button", { name: "Pause" }).click();
    await expect(focus.getByRole("button", { name: "Reprendre" })).toBeVisible();
    await expect(focus.getByRole("status").filter({ hasText: "Séance" })).toHaveText("Séance en pause");
  });

  test("badges are always written (rarity) and the locked one is marked", async ({ page }) => {
    await page.goto("/design-system");
    const badges = page.locator("#badges");
    for (const [name, rarity] of [
      ["1re fiche", "Commun"],
      ["10 h focus", "Rare"],
      ["Mentore", "Épique"],
    ]) {
      await expect(badges.getByRole("article", { name: new RegExp(`${name}, ${rarity}`) })).toBeVisible();
    }
    await expect(badges.getByRole("article", { name: /à débloquer/ })).toBeVisible();
  });
});
