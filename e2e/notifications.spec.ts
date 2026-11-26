import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

test("anonymous visit to the notifications redirects to login", async ({ page }) => {
  await page.goto("/social/notifications");
  await expect(page).toHaveURL(/\/connexion/);
});

test.describe("notifications (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("a friend request notifies once, can be read, and the preference is respected", async ({
    browser,
  }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    const alice = await newAccount(a, "alice");
    const bob = await newAccount(b, "bob");

    await b.goto("/social/notifications");
    await expect(b.getByText("Aucune notification")).toBeVisible();

    await a.goto("/social");
    await a.getByLabel("Pseudo de ton ami").fill(bob);
    await a.getByRole("button", { name: "Rechercher" }).click();
    await a.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(a.getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(0);

    await b.goto("/social");
    await expect(b.getByText("1 non lue")).toBeVisible();
    await b.goto("/social/notifications");
    await expect(b.getByText("t'a envoyé une demande d'ami.")).toHaveCount(1);
    await b.getByRole("button", { name: "Tout marquer comme lu" }).click();
    await expect(b.getByText("Tout est lu")).toBeVisible();
    await b.reload();
    await expect(b.getByText("Tout est lu")).toBeVisible();

    // Bob accepts: Alice is told, and Bob's own request notification is gone.
    await b.goto("/social");
    await b.getByRole("button", { name: "Accepter" }).click();
    // Wait for the server to confirm before looking from Alice's side (otherwise a race under parallel load).
    await expect(b.getByText("Vous êtes amis !")).toBeVisible();
    await expect(b.getByRole("button", { name: "Accepter" })).toHaveCount(0);
    await a.goto("/social/notifications");
    await expect(a.getByText("a accepté ta demande d'ami.")).toHaveCount(1);
    await b.goto("/social/notifications");
    await expect(b.getByText("t'a envoyé une demande d'ami.")).toHaveCount(0);
    expect(alice).toBeTruthy();
  });

  test("a switched-off kind is saved and no notification is created", async ({ browser }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await newAccount(a, "alice");
    const bob = await newAccount(b, "bob");

    await b.goto("/social/notifications");
    await b.getByLabel("Quand quelqu'un me demande en ami").uncheck();
    await b.reload();
    await expect(b.getByLabel("Quand quelqu'un me demande en ami")).not.toBeChecked();

    await a.goto("/social");
    await a.getByLabel("Pseudo de ton ami").fill(bob);
    await a.getByRole("button", { name: "Rechercher" }).click();
    await a.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(a.getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(0);

    await b.goto("/social/notifications");
    await expect(b.getByText("Aucune notification")).toBeVisible();
  });
});
