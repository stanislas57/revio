import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

test("anonymous visitor cannot reach the reminders mock-up", async ({ page }) => {
  await page.goto("/profil#rappels");
  await expect(page).toHaveURL(/\/connexion/);
});

// Connected scenario: `npm run test:e2e:connected`.
test.describe("reminders mock-up (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("is marked as a mock-up, asks for no permission, stores nothing", async ({ page }) => {
    // Spies installed before the page loads: any permission request or storage write would be counted.
    await page.addInitScript(() => {
      const w = window as unknown as { __spy: { permission: number; storage: number; requests: string[] } };
      w.__spy = { permission: 0, storage: 0, requests: [] };
      (window as unknown as { __initialPermission: string }).__initialPermission =
        "Notification" in window ? Notification.permission : "unsupported";
      if ("Notification" in window) {
        const original = Notification.requestPermission.bind(Notification);
        Notification.requestPermission = (...args: []) => {
          w.__spy.permission++;
          return original(...args);
        };
      }
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (...args: [string, string]) {
        if (/remind|rappel/i.test(args[0])) w.__spy.storage++;
        return setItem.apply(this, args);
      };
    });
    await newAccount(page, "rem");
    await page.goto("/profil");

    const card = page.locator("#rappels");
    await expect(card.getByRole("heading", { name: /Rappels/ })).toBeVisible();
    await expect(card.getByText("Données d'exemple")).toBeVisible();
    await expect(card.getByRole("note")).toContainText("Pas encore disponible");
    await expect(card.getByRole("button", { name: "Enregistrer les rappels" })).toBeDisabled();

    // The default preview, then the controls change it (keyboard and pointer).
    const status = card.getByRole("status");
    await expect(status).toHaveText("Un rappel du lundi au vendredi à 18 h 00.");
    await card.getByLabel("Heure du rappel").fill("07:30");
    await card.locator("label", { hasText: "Sam" }).click();
    await card.locator("label", { hasText: "Dim" }).click();
    await expect(status).toHaveText("Un rappel chaque jour à 07 h 30.");
    await card.getByLabel("lundi").focus(); // keyboard: Space toggles the day
    await page.keyboard.press("Space");
    await expect(status).toHaveText(
      "Un rappel : mardi, mercredi, jeudi, vendredi, samedi et dimanche, à 07 h 30.",
    );

    // Targets of at least 44 px.
    for (const target of [card.getByLabel("Heure du rappel"), card.locator("label", { hasText: "Mar" })]) {
      expect((await target.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    // No permission asked, nothing stored, and everything is back to the default after a reload.
    const spy = await page.evaluate(
      () => (window as unknown as { __spy: { permission: number; storage: number } }).__spy,
    );
    expect(spy).toMatchObject({ permission: 0, storage: 0 });
    // The permission is whatever the browser had before the page ran (it differs between browsers and CI).
    const initial = await page.evaluate(
      () => (window as unknown as { __initialPermission: string }).__initialPermission,
    );
    expect(await page.evaluate(() => Notification.permission)).toBe(initial);
    await page.reload();
    await expect(page.locator("#rappels").getByRole("status")).toHaveText(
      "Un rappel du lundi au vendredi à 18 h 00.",
    );
  });
});
