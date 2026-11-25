import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The charts load when they come near the screen (see lazy-charts.tsx). Connected scenario:
// `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("the statistics page shows its five graphics with a text alternative and a data table", async ({
  page,
}) => {
  await newAccount(page, "stat");
  await page.goto("/profil/statistiques");

  // The figures are there at once; the charts below load when scrolled near.
  await expect(page.getByText("Aujourd'hui", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("figure [role=img]")).toHaveCount(5); // heatmap + 4 charts
  await expect(page.locator("figure").filter({ hasText: "Temps par jour" })).toBeVisible();

  // Each chart has an alternative text and a table with the right number of rows.
  const alts = await page
    .locator("figure [role=img]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(alts.every((alt) => !!alt && alt.length > 20)).toBe(true);
  const rows = await page
    .locator("figure table")
    .evaluateAll((tables) => tables.map((t) => t.querySelectorAll("tbody tr").length));
  expect(rows.sort((a, b) => a - b)).toEqual([4, 5, 30, 30, 30]); // subjects, weeks, then 30 days three times

  // The graphics are really drawn (not empty boxes).
  await expect(page.locator("figure .recharts-surface").first()).toBeVisible();
  expect(await page.locator("figure .recharts-surface").count()).toBe(4);

  // No horizontal scroll, and no placeholder left behind.
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
});

test("the empty state still shows no chart and no placeholder", async ({ page }) => {
  await newAccount(page, "stat");
  await page.goto("/profil/statistiques?etat=vide");
  await expect(page.getByText("Pas encore de statistiques")).toBeVisible();
  await expect(page.locator("figure")).toHaveCount(0);
});
