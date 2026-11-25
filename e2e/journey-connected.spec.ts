import { expect, test, type Page } from "@playwright/test";

// Full two-account journey on the local fake Supabase: sign-up, username, friends, a shared Focus
// session that earns XP, the feed, a "Bravo" and the profile. Run with `npm run test:e2e:connected`,
// which starts the fake server and the app by itself (see playwright.connected.config.ts).
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";
const SESSION_MINUTES = 12; // above the 5 minutes the engine needs for XP (D-14), above the 10 for a streak day (D-15)
const rand = () => Math.random().toString(36).slice(2, 9);

/**
 * Simulated clock. The engine measures a session with the database clock (D-17: timestamps are never
 * written by the client), so the test cannot make the app believe time has passed. Instead the FAKE
 * server, started with --test-clock, moves the start of the running sessions into the past. The app has
 * no test hook, and the real Supabase has no such endpoint: nothing here can exist in production.
 */
async function advanceClock(minutes: number) {
  const res = await fetch(`${FAKE_URL}/__test/advance-clock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ minutes }),
  });
  expect(res.ok, "the fake server must be started with --test-clock").toBe(true);
  expect(((await res.json()) as { shifted: number }).shifted).toBeGreaterThan(0);
}

async function signUpWithUsername(page: Page, username: string) {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page.getByLabel("E-mail").fill(`journey-${Date.now()}-${rand()}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/accueil/);
  // The username is asked on /social (or on a screen before the app, once that exists).
  await page.goto("/social");
  await page.getByLabel("Pseudo", { exact: true }).fill(username);
  await page.getByRole("button", { name: /^(Enregistrer|Continuer)$/ }).click();
  await page.goto("/social");
  await expect(page.getByText("Ajouter un ami")).toBeVisible();
}

test("two accounts: friends, shared session with XP, feed, bravo, profile", async ({ browser }) => {
  const alice = `alice_${rand()}`;
  const bob = `bob_${rand()}`;
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();

  await test.step("both sign up and choose a username", async () => {
    await signUpWithUsername(a, alice);
    await signUpWithUsername(b, bob);
  });

  await test.step("Alice asks Bob as a friend, Bob accepts", async () => {
    await a.getByLabel("Pseudo de ton ami").fill(bob);
    await a.getByRole("button", { name: "Rechercher" }).click();
    await a.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(a.getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(0);
    await b.goto("/social");
    await b.getByRole("button", { name: "Accepter" }).click();
    await expect(b.getByText(alice).first()).toBeVisible();
  });

  await test.step("Alice starts a shared session, Bob sees her live", async () => {
    await a.goto("/focus");
    await a.getByRole("button", { name: "Démarrer" }).click();
    await expect(a.getByRole("timer")).toBeVisible();
    await b.goto("/social");
    await expect(b.getByText("1 ami révise en ce moment")).toBeVisible();
  });

  await test.step(`${SESSION_MINUTES} minutes pass (simulated), Alice finishes`, async () => {
    await advanceClock(SESSION_MINUTES);
    await a.reload();
    await a.getByRole("button", { name: "Terminer" }).click();
    await expect(a).toHaveURL(/\/focus\/seance\//);
    await expect(a.getByText(new RegExp(`\\+\\s*${SESSION_MINUTES}\\s*XP`)).first()).toBeVisible();
    await expect(a.getByText("Cette séance est publiée dans le fil de tes amis.")).toBeVisible();
  });

  await test.step("Bob sees the post in his feed and sends a bravo", async () => {
    await b.goto("/social");
    await expect(b.getByText("Aucun ami ne révise en ce moment.")).toBeVisible();
    await expect(b.getByText("a terminé").first()).toBeVisible();
    await b
      .getByRole("button", { name: /^Bravo/ })
      .first()
      .click();
    await expect(b.getByText("Bravo envoyé").first()).toBeVisible();
    await b.reload();
    await expect(b.getByText("Bravo envoyé").first()).toBeVisible();
  });

  await test.step("Alice sees the bravo, and her profile shows the XP", async () => {
    await a.goto("/social");
    await expect(a.getByText(/1 bravo reçu/)).toBeVisible();
    await a.goto("/profil");
    await expect(a.getByText(/Niveau 1/).first()).toBeVisible();
    await expect(a.getByText(new RegExp(`${SESSION_MINUTES}\\s*XP`)).first()).toBeVisible();
  });
});
