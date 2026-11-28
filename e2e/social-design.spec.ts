import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The Social page in the design of the app: live friends, feed, ranking. Connected scenario: see docs/E2E.md.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";

test("a friend studying, then a feed post and the week's ranking beside it", async ({ browser }) => {
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const b = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const alice = await newAccount(a, "soca");
  const bob = await newAccount(b, "socb");

  // Alice asks Bob, Bob accepts.
  await a.goto("/social");
  await a.getByLabel("Pseudo de ton ami").fill(bob);
  await a.getByRole("button", { name: "Rechercher" }).click();
  await a.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(a.getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(0);
  await b.goto("/social");
  await b.getByRole("button", { name: "Accepter" }).click();
  await expect(b.getByText("Vous êtes amis !")).toBeVisible();

  // Alice studies: Bob sees a card « En révision maintenant ».
  await a.goto("/focus");
  await a.getByRole("button", { name: "Démarrer" }).click();
  await expect(a.getByLabel("Séance en cours")).toBeVisible();
  await b.goto("/social");
  const live = b.getByRole("region", { name: "En révision maintenant" });
  await expect(live).toBeVisible();
  await expect(live.getByText("1 ami révise en ce moment")).toBeVisible();
  await expect(live.getByText(`@${alice}`)).toBeVisible();

  // Alice finishes a long session: a post with its duration and XP, and the ranking beside it.
  const shift = await fetch(`${FAKE_URL}/__test/advance-clock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ minutes: 30, username: alice }),
  });
  expect(shift.ok).toBe(true);
  await a.getByRole("button", { name: "Terminer" }).first().click();
  await expect(a).toHaveURL(/\/focus\/seance\//);
  await b.goto("/social");
  const post = b.getByRole("article");
  await expect(post).toContainText("a terminé 30 min");
  await expect(post).toContainText("+80 XP");
  await expect(b.getByText("Aucun ami ne révise en ce moment.")).toBeVisible();

  const board = b.getByRole("region", { name: "Classement de la semaine" });
  await expect(board).toContainText("Classement de la semaine");
  await expect(board.getByRole("listitem").first()).toContainText(`@${alice}`);
  await expect(board.getByRole("listitem").first()).toContainText("80 XP");
  await expect(board.getByText("Toi")).toBeVisible();
  await board.getByRole("link", { name: /Voir tout le classement/ }).click();
  await expect(b).toHaveURL(/\/social\/classement$/);
});

test("with no friend, the page opens on a phone, explains what to do and does not scroll sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await newAccount(page, "socsolo");
  await page.goto("/social");
  await expect(page.getByRole("heading", { name: "Social" })).toBeVisible();
  await expect(page.getByText("Pas encore d'amis")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
});
