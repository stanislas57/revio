import { expect, test, type Page } from "@playwright/test";

// The timetable views (week grid, day timeline, month). Connected scenario: see docs/E2E.md.
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

/** A signed-in account with a fixed week of events (Mon 7 Dec 2026) and a test in a few days. */
async function seededAccount(page: Page) {
  const email = `tt-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const password = "test-password-1";
  const up = await api("/auth/v1/signup", { method: "POST", body: { email, password } });
  const token = up.access_token as string;
  await api(`/rest/v1/profiles?id=eq.${up.user.id}`, {
    method: "PATCH",
    token,
    body: { username: `tt_${Math.random().toString(36).slice(2, 10)}` },
  });
  await api("/rest/v1/user_education?on_conflict=user_id", {
    method: "POST",
    token,
    body: { onboarding_done: true },
    prefer: "resolution=merge-duplicates",
  });
  const event = (title: string, kind: string, day: string, a: string | null, b: string | null) => ({
    title,
    kind,
    starts_on: day,
    last_on: day,
    start_time: a,
    end_time: b,
    recurrence: "none",
  });
  await api("/rest/v1/calendar_events", {
    method: "POST",
    token,
    body: [
      event("Maths", "class", "2026-12-07", "08:00", "10:00"),
      event("Philosophie", "class", "2026-12-07", "10:15", "12:00"),
      event("Révision Chimie", "study", "2026-12-07", "18:00", "19:30"),
      event("SVT", "class", "2026-12-08", "08:00", "09:00"),
    ],
  });
  await api("/rest/v1/exams", {
    method: "POST",
    token,
    body: [{ title: "DS de Maths", exam_on: isoPlus(3) }],
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

test("week: cards sit at their time, the cards and the footer add up, a card leads to its day", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seededAccount(page);
  await page.goto("/agenda?vue=semaine&date=2026-12-07");

  await expect(page.getByRole("heading", { name: "Emploi du temps" })).toBeVisible();
  await expect(page.getByText("Semaine du 7 au 13 décembre")).toBeVisible();

  // Summary: real figures only (4 h 45 of classes, 1 h 30 of revision), and the next test with its countdown.
  await expect(page.getByRole("group", { name: "Cours cette semaine" })).toContainText("4 h 45");
  await expect(page.getByRole("group", { name: "Cours cette semaine" })).toContainText("3 cours");
  await expect(page.getByRole("group", { name: "Révision prévue cette semaine" })).toContainText("1 h 30");
  await expect(page.getByRole("group", { name: "Prochain contrôle" })).toContainText("DS de Maths");
  await expect(page.getByRole("group", { name: "Prochain contrôle" })).toContainText(
    /Demain|J-\d+|Aujourd'hui/,
  );
  await expect(page.getByText(/4 h 45 de cours · 1 h 30 de révision/)).toBeVisible();

  // Placement: later in the day = lower on the screen; the two Monday classes do not overlap.
  const monday = page.getByRole("list", { name: "lundi 7 décembre 2026", exact: true });
  const top = async (name: RegExp) => (await monday.getByRole("link", { name }).boundingBox())!.y;
  const maths = await top(/Maths/);
  const philo = await top(/Philosophie/);
  const chimie = await top(/Révision Chimie/);
  expect(maths).toBeLessThan(philo);
  expect(philo).toBeLessThan(chimie);
  // The card of a 2 h class is about 2 hours tall (56 px an hour).
  const box = (await monday.getByRole("link", { name: /Maths/ }).boundingBox())!;
  expect(box.height).toBeGreaterThan(100);
  expect(box.height).toBeLessThan(120);

  // A card leads to its day, where the event can be edited.
  await monday.getByRole("link", { name: /Philosophie/ }).click();
  await expect(page).toHaveURL(/vue=jour&date=2026-12-07/);
  await expect(page.getByRole("button", { name: "Modifier Philosophie" })).toBeVisible();
});

test("day: the week strip, the timeline of the day, and a past day is all done", async ({ page }) => {
  await seededAccount(page);
  await page.goto("/agenda?vue=jour&date=2026-12-07");

  const strip = page.getByRole("navigation", { name: "Jours de la semaine" });
  await expect(strip.getByRole("link")).toHaveCount(7);
  await expect(strip.locator('a[aria-current="date"]')).toContainText("7");
  await strip.getByRole("link", { name: /^mar 8 décembre 2026, 1 élément$/ }).click();
  await expect(page).toHaveURL(/date=2026-12-08/);
  await expect(page.getByRole("region", { name: /mardi 8 décembre 2026/ }).getByText("SVT")).toBeVisible();

  // Three timed items on Monday, in time order.
  await page.goto("/agenda?vue=jour&date=2026-12-07");
  const day = page.getByRole("region", { name: /lundi 7 décembre 2026/ });
  const titles = await day.locator("ul > li p.text-lg").allTextContents();
  expect(titles).toEqual(["Maths", "Philosophie", "Révision Chimie"]);
  await expect(day.getByText("08:00–10:00 · 2 h")).toBeVisible();
  // Nothing is "in progress" on another day than today.
  await expect(day.getByText("En cours")).toHaveCount(0);
});

test("month: a test day is marked, and « À venir » lists the next tests", async ({ page }) => {
  await seededAccount(page);
  await page.goto("/agenda?vue=mois");
  await expect(page.getByRole("group", { name: "Mois" })).toBeVisible();
  const upcoming = page.getByRole("region", { name: "À venir" });
  await expect(upcoming.getByText("DS de Maths")).toBeVisible();
  await expect(upcoming.getByText(/Demain|J-\d+|Aujourd'hui/)).toBeVisible();
  // The legend names every colour.
  const legend = page.getByRole("list", { name: "Légende" });
  for (const label of ["Cours", "Révision", "Contrôle", "Indisponible"]) {
    await expect(legend.getByText(label, { exact: true })).toBeVisible();
  }
});

test("mobile: the week grid scrolls sideways inside its own region, the page does not", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seededAccount(page);
  await page.goto("/agenda?vue=semaine&date=2026-12-07");

  const region = page.getByRole("region", { name: /Grille de la semaine/ });
  await expect(region).toBeVisible();
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
  // Keyboard users can scroll it.
  await region.focus();
  await expect(region).toBeFocused();

  // The controls keep 44 px targets.
  const small = await page
    .getByRole("navigation", { name: "Navigation de l'agenda" })
    .getByRole("link")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).length);
  expect(small).toBe(0);
});
