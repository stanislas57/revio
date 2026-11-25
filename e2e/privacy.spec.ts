import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

test("anonymous visitor cannot reach the data section", async ({ page }) => {
  await page.goto("/profil#mes-donnees");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByText("Mes données")).toHaveCount(0);
});

test.describe("'Mes données' (connected)", () => {
  test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

  test("explains what is kept and who sees it; export and deletion are marked as not available", async ({
    page,
  }) => {
    await newAccount(page, "priv");
    await page.goto("/profil");
    const section = page.locator("#mes-donnees");
    await expect(section.getByRole("heading", { name: "Mes données" })).toBeVisible();

    // Three audiences, widest first.
    await expect(section.getByRole("heading", { level: 3 })).toHaveText([
      "Visible par les autres utilisateurs connectés",
      "Visible par tes amis",
      "Visible par les personnes concernées",
      "Visible par toi seul",
      "Récupérer ou supprimer mes données",
    ]);

    // Notes and subjects are said to stay private (D-16).
    const privateGroup = section.locator('section[aria-labelledby="data-me"]');
    await expect(privateGroup).toContainText("Tes matières, tes notes");
    await expect(privateGroup).toContainText("Jamais visibles par un autre utilisateur");
    const friendsGroup = section.locator('section[aria-labelledby="data-friends"]');
    await expect(friendsGroup).not.toContainText(/notes|matières, /i);

    // The two buttons are disabled and the section says they do not work yet.
    await expect(section.getByRole("note")).toContainText("Pas encore disponible");
    for (const name of ["Exporter mes données", "Supprimer mon compte"]) {
      const button = section.getByRole("button", { name });
      await expect(button).toBeDisabled();
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});
