// Builds docs/demo/releve-demo.pdf: an invented transcript (text layer) for the demo of the document import.
// Usage: node scripts/make-demo-pdf.mjs
import { writeFileSync } from "node:fs";

const lines = [
  "Releve de notes - exemple Revio (donnees inventees)",
  "Mathematiques coef 4 : 14,5 / 20",
  "Mathematiques coef 4 : 11 / 20",
  "Physique-Chimie coef 3 : 9,5 / 20",
  "Anglais coef 2 : 16 / 20",
  "Histoire-Geographie coef 2 : 12 / 20",
  "Francais coef 3 : 13 / 20",
  "Moyenne generale : 12,9",
];
const text = lines.map((l, i) => `BT /F1 12 Tf 50 ${780 - i * 22} Td (${l}) Tj ET`).join("\n");
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];
let out = "%PDF-1.4\n";
const offsets = [];
objects.forEach((o, i) => {
  offsets.push(out.length);
  out += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = out.length;
out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
writeFileSync(new URL("../docs/demo/releve-demo.pdf", import.meta.url), Buffer.from(out, "latin1"));
console.log("docs/demo/releve-demo.pdf written");
