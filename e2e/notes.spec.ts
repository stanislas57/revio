import { expect, test, type Page } from "@playwright/test";
import { newAccount } from "./support/new-account";

// The Notes category: « Mes notes » and its sub-pages. Connected scenario: see docs/E2E.md.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

const FAKE_URL = process.env.E2E_FAKE_SUPABASE_URL ?? "http://127.0.0.1:54399";
const KEY = "local-fake-key";

async function api(
  path: string,
  init: { method?: string; token?: string; body?: unknown; prefer?: string } = {},
) {
  const res = await fetch(`${FAKE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: KEY,
      "content-type": "application/json",
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const isoPlus = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/** A signed-in account with four subjects (overall average 13,80 on 20) and two exams. */
async function accountWithNotes(page: Page) {
  const email = `notes-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const password = "test-password-1";
  const up = await api("/auth/v1/signup", { method: "POST", body: { email, password } });
  const token = up.access_token as string;
  await api(`/rest/v1/profiles?id=eq.${up.user.id}`, {
    method: "PATCH",
    token,
    body: { username: `nt_${Math.random().toString(36).slice(2, 10)}` },
  });
  await api("/rest/v1/user_education?on_conflict=user_id", {
    method: "POST",
    token,
    body: { onboarding_done: true },
    prefer: "resolution=merge-duplicates",
  });
  const subjects = await api("/rest/v1/subjects?select=id,name", {
    method: "POST",
    token,
    prefer: "return=representation",
    body: [
      { name: "Maths", coefficient: 4 },
      { name: "Philosophie", coefficient: 2 },
      { name: "SVT", coefficient: 2 },
      { name: "Histoire-Géo", coefficient: 2 },
    ],
  });
  const id = Object.fromEntries((subjects as { id: string; name: string }[]).map((s) => [s.name, s.id]));
  const grade = (subject: string, value: number) => ({
    subject_id: id[subject],
    value,
    max_value: 20,
    coefficient: 1,
    kind: "continuous",
    graded_on: "2026-11-10",
  });
  await api("/rest/v1/grades", {
    method: "POST",
    token,
    body: [
      grade("Maths", 12),
      grade("Maths", 15),
      grade("Maths", 16.5),
      grade("Philosophie", 9),
      grade("Philosophie", 13),
      grade("SVT", 16),
      grade("SVT", 15.5),
      grade("Histoire-Géo", 14),
      grade("Histoire-Géo", 12.5),
    ],
  });
  await api("/rest/v1/exams", {
    method: "POST",
    token,
    body: [
      { title: "DS de Maths", exam_on: isoPlus(2), subject_id: id.Maths },
      { title: "Contrôle de SVT", exam_on: isoPlus(12), subject_id: id.SVT },
    ],
  });
  await page.goto("/connexion");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page
    .getByRole("button", { name: /Se connecter/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/accueil/);
}

test("Mes notes: the average, the next exam and the way to the other pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await accountWithNotes(page);
  await page.goto("/notes");

  await expect(page.getByRole("heading", { name: "Mes notes" })).toBeVisible();
  const average = page.getByRole("group", { name: "Moyenne générale" });
  await expect(average).toContainText("13,80");
  await expect(average).toContainText("9 notes prises en compte");
  const exam = page.getByRole("group", { name: "Prochain examen" });
  await expect(exam).toContainText("DS de Maths");
  await expect(exam).toContainText("Dans 2 jours");

  // Four subjects, in tinted cards; the averages are Revio's convention, and it says so.
  await expect(page.locator("#matieres ~ [data-slot=card] [data-slot=card-title]")).toHaveText([
    "Maths",
    "Philosophie",
    "SVT",
    "Histoire-Géo",
  ]);
  await expect(page.getByText(/convention Revio/).first()).toBeVisible();

  // The links lead to the sub-pages.
  const more = page.getByRole("group", { name: "Aller plus loin" });
  await more.getByRole("link", { name: /Simulateur/ }).click();
  await expect(page).toHaveURL(/\/notes\/simulateur$/);
  await page.getByRole("link", { name: "Mes notes", exact: true }).first().click();
  await expect(page).toHaveURL(/\/notes$/);
  await more.getByRole("link", { name: /Répartir mon temps/ }).click();
  await expect(page).toHaveURL(/\/notes\/temps$/);
  await expect(page.getByRole("heading", { name: "Répartir mon temps" })).toBeVisible();
  await page.goto("/notes");
  await page.getByRole("link", { name: "Importer un relevé" }).click();
  await expect(page).toHaveURL(/\/notes\/importer#importer$/);
  await expect(page.getByRole("heading", { name: "Importer · ajouter" })).toBeVisible();
});

test("Accueil: the notes card shows the average and leads to Notes", async ({ page }) => {
  await accountWithNotes(page);
  await page.goto("/accueil");
  // The notes themselves moved to Notes: none of their forms is left on the home page.
  await expect(page.getByLabel("Objectif de moyenne (/20)")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ajouter la matière" })).toHaveCount(0);
  const card = page.getByRole("link", { name: "Voir mes notes" });
  await expect(card).toBeVisible();
  await expect(page.locator("main")).toContainText("13,80");
  await card.click();
  await expect(page).toHaveURL(/\/notes$/);
});

test("with no subject yet, the simulator and the time split say what to do first", async ({ page }) => {
  await newAccount(page, "empty");
  for (const [path, title] of [
    ["/notes/simulateur", "Simulateur"],
    ["/notes/temps", "Répartir mon temps"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Il faut au moins une matière")).toBeVisible();
    await page.getByRole("link", { name: "Ajouter ma première matière" }).click();
    await expect(page).toHaveURL(/\/notes\/importer#ajouter-matiere$/);
  }
});

test("mobile: the Notes tab, no horizontal scroll, 44 px targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await accountWithNotes(page);
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Notes" })
    .click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }).locator('a[aria-current="page"]'),
  ).toHaveText("Notes");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
  const small = await page
    .getByRole("group", { name: "Aller plus loin" })
    .getByRole("link")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
  expect(small).toBe(0);
});
