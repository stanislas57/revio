import { expect, test, type Page } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

/** Opens the invitation link as a visitor and waits until the invitation is remembered. */
async function openInvite(page: Page, code: string) {
  await page.goto(`/invite/${code}`);
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === "revio-invite"))
    .toBe(true);
}

test.describe("invite a friend: link, QR code and sharing", () => {
  test("a personal link, its QR code and the sharing buttons, all at least 44 px", async ({ page }) => {
    const username = await newAccount(page, "inv");
    await page.goto("/social");

    const url = page.getByTestId("invite-url");
    await expect(url).toHaveText(new RegExp(`/invite/${username}$`));
    await expect(page.getByRole("img", { name: "QR code de ton lien d'invitation" })).toBeVisible();

    // Public share links, no API key.
    const href = (name: string) => page.getByRole("link", { name }).getAttribute("href");
    expect(await href("WhatsApp")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(await href("SMS")).toMatch(/^sms:\?&body=/);
    expect(await href("Snapchat")).toMatch(/^https:\/\/www\.snapchat\.com\/scan\?attachmentUrl=/);
    expect(decodeURIComponent((await href("Snapchat")) ?? "")).toContain(`/invite/${username}`);

    for (const name of ["WhatsApp", "SMS", "Snapchat"]) {
      const box = await page.getByRole("link", { name }).boundingBox();
      expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    }
    for (const name of ["Instagram", "Messenger", "Copier le lien"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    }
  });

  test("« Copier le lien » copies the link; Instagram copies it with a note to paste it in a DM", async ({
    browser,
  }) => {
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const username = await newAccount(page, "invcopy");
    await page.goto("/social");
    // The live region exists before the click (otherwise screen readers may miss the announcement).
    await expect(page.getByRole("status").filter({ hasText: /^$/ }).first()).toBeAttached();

    await page.getByRole("button", { name: "Copier le lien" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Lien copié." })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      new RegExp(`^https?://[^/]+/invite/${username}$`),
    );

    await page.getByRole("button", { name: "Instagram" }).click();
    await expect(page.getByText("colle-le en message privé sur Instagram")).toBeVisible();
    await context.close();
  });

  test("when the browser refuses to copy, the message is shown to copy by hand", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
        configurable: true,
      });
    });
    const username = await newAccount(page, "invdeny");
    await page.goto("/social");
    await page.getByRole("button", { name: "Copier le lien" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Copie impossible" })).toBeVisible();
    await expect(page.getByLabel("Message d'invitation à copier")).toHaveValue(
      new RegExp(`/invite/${username}`),
    );
  });

  test("the share sheet is used when the browser has one (Instagram, Snapchat, Messenger…)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared?: unknown };
      Object.defineProperty(navigator, "share", {
        value: (data: unknown) => {
          w.__shared = data;
          return Promise.resolve();
        },
        configurable: true,
      });
    });
    const username = await newAccount(page, "invshare");
    await page.goto("/social");
    await page.getByRole("button", { name: "Partager…" }).click();
    const shared = await page.evaluate(() => (window as unknown as { __shared?: { url: string } }).__shared);
    expect(shared?.url).toMatch(new RegExp(`/invite/${username}$`));
    // Instagram goes through the same sheet.
    await page.evaluate(() => delete (window as unknown as { __shared?: unknown }).__shared);
    await page.getByRole("button", { name: "Instagram" }).click();
    expect(await page.evaluate(() => (window as unknown as { __shared?: unknown }).__shared)).toBeTruthy();
  });
});

test.describe("opening an invitation link", () => {
  test("a visitor signs up, then the friend request is sent by itself", async ({ browser }) => {
    const alice = await (await browser.newContext()).newPage();
    const aliceName = await newAccount(alice, "alice");

    const bob = await (await browser.newContext()).newPage();
    await openInvite(bob, aliceName);
    await expect(bob.getByRole("heading", { level: 1 })).toContainText("Un ami t'invite");
    await expect(bob.getByRole("link", { name: "Rejoindre Revio" })).toHaveAttribute("href", "/connexion");
    const bobName = await newAccount(bob, "bob"); // sign-up, username, onboarding skipped
    await expect(bob.getByText("Demande d'ami envoyée")).toBeVisible();
    // Sent only once: the invitation is forgotten.
    expect((await bob.context().cookies()).some((c) => c.name === "revio-invite")).toBe(false);

    await alice.goto("/social");
    await expect(alice.getByText(bobName).first()).toBeVisible();
    await expect(alice.getByRole("button", { name: "Accepter" })).toBeVisible();
  });

  test("a signed-in user is sent to Social and the request goes out", async ({ browser }) => {
    const alice = await (await browser.newContext()).newPage();
    const aliceName = await newAccount(alice, "alice2");
    const carol = await (await browser.newContext()).newPage();
    const carolName = await newAccount(carol, "carol");

    await carol.goto(`/invite/${aliceName}`);
    await expect(carol).toHaveURL(/\/social/);
    await expect(carol.getByText("Demande d'ami envoyée")).toBeVisible();

    await alice.goto("/social");
    await expect(alice.getByText(carolName).first()).toBeVisible();
  });

  test("one's own link, a stranger's code and a malformed code are handled", async ({ page }) => {
    const me = await newAccount(page, "own");
    await page.goto(`/invite/${me}`);
    await expect(page).toHaveURL(/\/social/);
    await expect(page.getByText("C'est ton propre lien d'invitation.")).toBeVisible();

    await page.goto("/invite/zz_nobody_here_1");
    await expect(page).toHaveURL(/\/social/);
    await expect(page.getByText("Cette invitation n'est plus valable.")).toBeVisible();

    const bad = await page.goto("/invite/Not%20A%20Code");
    expect(bad?.status()).toBe(404);
  });
});
