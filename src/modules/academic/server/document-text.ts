import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_TEXT_CHARS = 200_000;

export type TextResult =
  { ok: true; text: string } | { ok: false; reason: "too_big" | "unsupported" | "scan" | "unreadable" };

const startsWith = (b: Uint8Array, ascii: string) => [...ascii].every((c, i) => b[i] === c.charCodeAt(0));

/**
 * Text of an uploaded document, in memory only (the file is never stored). The type is decided by the
 * content, not by the name or the type the browser announces: a PDF starts with "%PDF"; anything else must
 * be plain text (CSV, TXT) with no NUL byte.
 */
export async function readDocumentText(file: File): Promise<TextResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "too_big" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) return { ok: false, reason: "unreadable" };

  if (startsWith(bytes, "%PDF")) {
    try {
      const pdf = await getDocumentProxy(bytes);
      if (pdf.numPages > 30) return { ok: false, reason: "too_big" };
      const { text } = await extractText(pdf, { mergePages: true });
      const clean = text.trim();
      // A scanned document has pages but no text layer.
      if (clean.replace(/\s/g, "").length < 20) return { ok: false, reason: "scan" };
      return { ok: true, text: clean.slice(0, MAX_TEXT_CHARS) };
    } catch {
      return { ok: false, reason: "unreadable" };
    }
  }

  if (bytes.includes(0)) return { ok: false, reason: "unsupported" };
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1252").decode(bytes); // old spreadsheet exports
  }
  return { ok: true, text: text.slice(0, MAX_TEXT_CHARS) };
}
