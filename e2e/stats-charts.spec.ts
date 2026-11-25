import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";

// The charts load when they come near the screen (see lazy-charts.tsx). Connected scenario:
// `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("the statistics page shows its five graphics with a text alternative and a data table", async ({
  page,
}) => {
  const username = await newAccount(page, "stat");
  // One real 12-minute session: the fake server (started with --test-clock) moves its start into the past.
  await page.goto("/focus");
  await page.getByRole("button", { name: "Démarrer" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  const shift = await fetch(`${FAKE_URL}/__test/advance-clock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ minutes: 12, username }),
  });
  expect(shift.ok, "the fake server must be started with --test-clock").toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/\/focus\/seance\//);

  await page.goto("/profil/statistiques");
  await expect(page.getByText("Séances", { exact: true })).toBeVisible();

  // The figures are there at once; the charts below load when scrolled near.
  await expect(page.getByText("Aujourd'hui", { exact: true })).toBeVisible();
  // The charts load when they come near the screen: scroll step by step, as a person does (a phone is taller).
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
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
  const sorted = rows.sort((a, b) => a - b);
  expect(sorted.slice(2)).toEqual([30, 30, 30]); // 30 days, three charts
  expect(sorted[0]).toBe(1); // one subject bucket ("Sans matière")
  expect([5, 6]).toContain(sorted[1]); // 30 days span 5 or 6 Monday-to-Sunday weeks

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
