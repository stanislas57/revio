import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Réglages > Apparence: the menu on the left (default) or in a horizontal bar at the top, saved on the account.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const SIDEBAR = "Barre latérale à gauche";
const TOP = "Barre horizontale en haut";

test("the layout switches at once, is saved on the account and survives a reload", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await newAccount(page, "navl");
  await page.goto("/profil");

  // Default: the sidebar, with the two preview cards offered.
  await expect(page.getByRole("complementary")).toBeVisible();
  const group = page.getByRole("group", { name: "Disposition du menu" });
  await expect(group.getByRole("radio", { name: new RegExp(SIDEBAR) })).toBeChecked();
  await expect(group.getByRole("radio", { name: new RegExp(TOP) })).not.toBeChecked();

  await group.getByText(TOP, { exact: true }).click();
  await expect(page.getByText("Disposition enregistrée.")).toBeVisible();
  await expect(page.getByRole("complementary")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav.getByRole("link")).toHaveText(["Accueil", "Social", "Notes", "Agenda", "Réviser"]);
  // On the profile no entry is marked (it has none): on Notes, Notes is.
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(0);
  // Icons and names, in one horizontal line (every entry on the same row).
  const tops = await nav
    .getByRole("link")
    .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);

  // Saved on the account: still there after a reload and on another page.
  await page.reload();
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await nav.getByRole("link", { name: "Social" }).click();
  await expect(page).toHaveURL(/\/social$/);
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();

  // A second device (empty localStorage) gets the saved layout from the account.
  const other = await page
    .context()
    .browser()!
    .newContext({ storageState: await page.context().storageState() });
  const second = await other.newPage();
  await second.goto("/accueil");
  await expect(second.getByRole("complementary")).toHaveCount(0);
  await other.close();

  // Back to the sidebar.
  await page.goto("/profil");
  await page.getByRole("group", { name: "Disposition du menu" }).getByText(SIDEBAR, { exact: true }).click();
  await expect(page.getByRole("complementary")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("complementary")).toBeVisible();
});

test("on mobile the top bar scrolls sideways and replaces the bottom bar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await newAccount(page, "navm");
  await page.goto("/profil");
  await page.getByRole("group", { name: "Disposition du menu" }).getByText(TOP, { exact: true }).click();
  await expect(page.getByText("Disposition enregistrée.")).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(nav).toHaveCount(1);
  await expect(nav.getByRole("link", { name: "Accueil" })).toBeVisible();
  // Five entries do not fit in 375 px: the strip scrolls, the page itself does not.
  const strip = nav.getByRole("list");
  expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
  await nav.getByRole("link", { name: "Réviser" }).scrollIntoViewIfNeeded();
  // Targets stay at least 44 px high.
  const small = await nav
    .getByRole("link")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
  expect(small).toBe(0);
});

test("the cards are radios: Space on the focused one switches the layout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await newAccount(page, "navk");
  await page.goto("/profil");
  const top = page.getByRole("radio", { name: new RegExp(TOP) });
  await top.focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Disposition enregistrée.")).toBeVisible();
  await expect(top).toBeChecked();
});
