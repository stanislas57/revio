import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test.describe("invite a friend", () => {
  test("copies a message with my username, announced in a live region, no link", async ({ browser }) => {
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const username = await newAccount(page, "inv");
    await page.goto("/social");

    const button = page.getByRole("button", { name: "Inviter un ami" });
    await expect(button).toBeVisible();
    expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    // The live region exists before the click (otherwise screen readers may miss the announcement).
    const status = page.getByRole("status").filter({ hasText: /^$/ });
    await expect(status.first()).toBeAttached();

    await button.click();
    await expect(page.getByRole("status").filter({ hasText: "Message copié" })).toBeVisible();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(username);
    expect(copied).not.toMatch(/https?:|www\./);
    await context.close();
  });

  test("when the browser refuses to copy, the message is shown to copy by hand", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
        configurable: true,
      });
    });
    const username = await newAccount(page, "inv");
    await page.goto("/social");
    await page.getByRole("button", { name: "Inviter un ami" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Copie impossible" })).toBeVisible();
    await expect(page.getByLabel("Message d'invitation à copier")).toHaveValue(new RegExp(username));
  });

  test("works with the keyboard", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    });
    await newAccount(page, "inv");
    await page.goto("/social");
    await page.getByRole("button", { name: "Inviter un ami" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Message copié" })).toBeVisible();
  });
});
