import { expect, test, type Page } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario with the simulated clock of `npm run test:e2e:connected` (the fake server started
// with --test-clock moves the start of the running session into the past).
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";
const MINUTES = 12;

async function advanceClock(minutes: number, username: string) {
  const res = await fetch(`${FAKE_URL}/__test/advance-clock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ minutes, username }),
  });
  expect(res.ok, "the fake server must be started with --test-clock").toBe(true);
}

async function startAndAdvance(page: Page) {
  const username = await newAccount(page, "imm");
  await page.goto("/focus");
  await page.getByRole("button", { name: "Démarrer" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await advanceClock(MINUTES, username);
  await page.reload();
  await expect(page.getByRole("button", { name: "Plein écran" })).toBeVisible();
}

test.describe("immersive session", () => {
  test("big timer, Pause and Finish only; Escape leaves and gives the focus back", async ({ page }) => {
    await startAndAdvance(page);
    const trigger = page.getByRole("button", { name: "Plein écran" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Séance en plein écran" });
    await expect(dialog).toBeVisible();
    // Sober: the timer and the two buttons (plus the small close button for touch screens), nothing else.
    await expect(dialog.getByRole("button")).toHaveText(["", "Pause", "Terminer"]);
    await expect(dialog.getByRole("button", { name: /Quitter le plein écran/ })).toBeVisible();
    // The timer shows the simulated time (12 minutes and a few seconds).
    await expect(dialog.getByRole("timer")).toHaveText(
      new RegExp(`^(${MINUTES - 1}:5\\d|${MINUTES}:\\d\\d)$`),
    );
    // Nothing of the app shows through: the navigation bars are hidden behind the dialog.
    const covered = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label]");
      if (!nav) return true;
      const r = nav.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return true; // not displayed at this size
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top?.closest("[role=dialog]");
    });
    expect(covered).toBe(true);
    // The page behind is not reachable (inert) and cannot scroll.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await expect(page.getByRole("timer")).toHaveCount(1); // only the dialog's timer is exposed

    // The keyboard stays inside: Tab and Shift+Tab loop over the dialog's buttons.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("Pause freezes the timer, Resume restarts it, Finish gives the XP of the normal flow", async ({
    page,
  }) => {
    await startAndAdvance(page);
    await page.getByRole("button", { name: "Plein écran" }).click();
    const dialog = page.getByRole("dialog", { name: "Séance en plein écran" });

    await dialog.getByRole("button", { name: "Pause" }).click();
    await expect(dialog.getByRole("button", { name: "Reprendre" })).toBeVisible();
    await expect(dialog.getByRole("status")).toHaveText("Séance en pause");
    const frozen = await dialog.getByRole("timer").innerText();
    await page.waitForTimeout(2200);
    expect(await dialog.getByRole("timer").innerText()).toBe(frozen);

    await dialog.getByRole("button", { name: "Reprendre" }).click();
    await expect(dialog.getByRole("button", { name: "Pause" })).toBeVisible();

    await dialog.getByRole("button", { name: "Terminer" }).click();
    await expect(page).toHaveURL(/\/focus\/seance\//);
    // 12 minutes = 12 XP (1 XP per minute): the XP rule is untouched.
    await expect(page.getByText(new RegExp(`\\+\\s*${MINUTES}\\s*XP`)).first()).toBeVisible();
  });

  test("no animation when the user prefers reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startAndAdvance(page);
    await page.getByRole("button", { name: "Plein écran" }).click();
    const dialog = page.getByRole("dialog", { name: "Séance en plein écran" });
    // An element has no transition when its transition property is "none" or its durations are all 0.
    const offenders = await dialog.evaluate((root) =>
      [root, ...root.querySelectorAll("*")]
        .map((el) => {
          const s = getComputedStyle(el);
          const still =
            s.transitionProperty === "none" ||
            s.transitionDuration.split(",").every((d) => d.trim() === "0s");
          return {
            el: `${el.tagName}.${String(el.getAttribute("class")).slice(0, 40)}`,
            animated: s.animationName !== "none" || !still,
          };
        })
        .filter((x) => x.animated)
        .map((x) => x.el),
    );
    expect(offenders).toEqual([]);
  });

  test("the close button works with a pointer (touch screens have no Escape key)", async ({ page }) => {
    await startAndAdvance(page);
    await page.getByRole("button", { name: "Plein écran" }).click();
    const close = page.getByRole("button", { name: /Quitter le plein écran/ });
    expect((await close.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await close.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("timer")).toBeVisible();
  });
});
