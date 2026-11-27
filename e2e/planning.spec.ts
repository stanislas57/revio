import { expect, test } from "@playwright/test";
import { addSubject } from "./support/notes";
import { skipOnboarding } from "./support/new-account";

// Connected scenario (fake Supabase server): see docs/E2E.md. Skipped without E2E_CONNECTED.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

test("planning: propose, accept, lock, replan keeps the locked session", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: /Inscris-toi/ }).click();
  await page
    .getByLabel("E-mail")
    .fill(`plan-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`);
  await page.getByLabel("Mot de passe").fill("test-password-1");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.getByLabel("Pseudo").fill(`pl_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await skipOnboarding(page);

  // One subject without any grade: it has a priority, so it gets sessions.
  await addSubject(page, "Maths", "3");

  await page.goto("/agenda");
  await expect(page.getByText(/Convention Revio/)).toBeVisible();
  await page.getByRole("button", { name: "Proposer un planning" }).click();
  await expect(page.getByRole("status")).toContainText(/proposée/);

  // Tomorrow is entirely free: exactly one proposed session for the only subject.
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  });
  await page.goto(`/agenda?vue=jour&date=${tomorrow}`);
  const session = page.getByRole("listitem").filter({ hasText: "Réviser Maths" });
  await expect(session).toHaveCount(1);
  await expect(session.getByText("Recommandée")).toBeVisible();
  await expect(session.getByText("08:00–08:45")).toBeVisible();
  await session.getByText("Pourquoi cette séance ?").click();
  await expect(session.getByText(/Aucune note encore/)).toBeVisible();

  await session.getByRole("button", { name: "Accepter Réviser Maths" }).click();
  await expect(session.getByText("Acceptée")).toBeVisible();
  await session.getByRole("button", { name: "Verrouiller Réviser Maths" }).click();
  await expect(session.getByText("Verrouillée")).toBeVisible();

  // Replanning replaces the proposals but never the locked session.
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Replanifier les propositions" }).click();
  await expect(page.getByRole("status")).toContainText(/proposée/);
  await page.goto(`/agenda?vue=jour&date=${tomorrow}`);
  await expect(session).toHaveCount(1);
  await expect(session.getByText("Verrouillée")).toBeVisible();
});
