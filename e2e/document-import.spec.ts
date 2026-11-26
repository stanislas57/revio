import { expect, test } from "@playwright/test";
import { newAccount } from "./support/new-account";

// Connected scenario: `npm run test:e2e:connected`.
test.skip(!process.env.E2E_CONNECTED, "needs the local fake Supabase server");

/** A one-page PDF with a text layer (hand-made, no library): enough for the text reader. */
function pdfWithLines(lines: string[]): Buffer {
  const text = lines.map((l, i) => `BT /F1 12 Tf 50 ${750 - i * 20} Td (${l}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

test("a transcript PDF is read, checked by the user, then imported without being stored", async ({
  page,
}) => {
  await newAccount(page, "doc");
  await page.goto("/accueil");
  await page.getByLabel(/^Document/).setInputFiles({
    name: "releve.pdf",
    mimeType: "application/pdf",
    buffer: pdfWithLines([
      "Releve de notes",
      "Mathematiques coef 4 14,5",
      "Anglais coef 2 12",
      "Moyenne generale 13,6",
    ]),
  });
  await page.getByRole("button", { name: "Analyser le document" }).click();

  await expect(page.getByText("Vérifie les 2 lignes proposées")).toBeVisible();
  await expect(page.locator("#name-0")).toHaveValue("Mathematiques");
  // The user corrects a line before importing.
  await page.locator("#coef-0").fill("5");
  await page.getByRole("button", { name: "Importer les lignes cochées" }).click();
  await expect(page.getByText("2 matières et 2 notes ajoutées.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Mathematiques").first()).toBeVisible();
  await expect(page.getByText("Anglais").first()).toBeVisible();
});

test("pasted text and a CSV work; an unchecked line is not imported; a second import does not duplicate", async ({
  page,
}) => {
  await newAccount(page, "csv");
  await page.goto("/accueil");
  await page.getByLabel(/^Document/).setInputFiles({
    name: "matieres.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Matière;Coef;Note\nPhilosophie;3;13,5\nEPS;1;17\n", "utf8"),
  });
  await page.getByRole("button", { name: "Analyser le document" }).click();
  await page.getByRole("checkbox", { name: "Importer EPS" }).uncheck();
  await page.getByRole("button", { name: "Importer les lignes cochées" }).click();
  await expect(page.getByText("1 matière et 1 note ajoutées.")).toBeVisible();

  await page.getByLabel("Ou colle le texte du document").fill("Philosophie 15");
  await page.getByRole("button", { name: "Analyser le document" }).click();
  await page.getByRole("button", { name: "Importer les lignes cochées" }).click();
  await expect(page.getByText("0 matière et 1 note ajoutées.")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-slot=card-title]", { hasText: "Philosophie" })).toHaveCount(1);
});

test("a file that is not a document is refused with a clear message", async ({ page }) => {
  await newAccount(page, "bad");
  await page.goto("/accueil");
  await page.getByLabel(/^Document/).setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]),
  });
  await page.getByRole("button", { name: "Analyser le document" }).click();
  await expect(page.getByText(/Format non pris en charge/)).toBeVisible();
});
