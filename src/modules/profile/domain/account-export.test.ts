import { describe, expect, it } from "vitest";
import {
  buildExport,
  DELETE_CONFIRMATION,
  EXPORT_TABLES,
  exportFilename,
  isDeleteConfirmed,
} from "./account-export";

describe("export", () => {
  it("builds a versioned document with the data as given", () => {
    const doc = buildExport({
      now: new Date("2026-11-25T10:00:00Z"),
      email: "a@x.fr",
      data: { subjects: [{ id: "1" }] },
      skippedTables: ["calendar_events"],
    });
    expect(doc).toMatchObject({
      format: "revio-export",
      version: 1,
      generatedAt: "2026-11-25T10:00:00.000Z",
      account: { email: "a@x.fr" },
      data: { subjects: [{ id: "1" }] },
      skippedTables: ["calendar_events"],
    });
    expect(doc.notes.length).toBeGreaterThan(0);
  });

  it("names the file after the day", () => {
    expect(exportFilename(new Date("2026-11-25T23:59:00Z"))).toBe("revio-export-2026-11-25.json");
  });

  it("lists each table once, with an owner column", () => {
    const tables = EXPORT_TABLES.map((t) => t.table);
    expect(new Set(tables).size).toBe(tables.length);
    expect(new Set(EXPORT_TABLES.map((t) => t.key)).size).toBe(tables.length);
    for (const t of EXPORT_TABLES) expect(t.column).toMatch(/^(id|user_id)$/);
  });

  it("never exports a secret-looking table", () => {
    expect(EXPORT_TABLES.map((t) => t.table).join(" ")).not.toMatch(/token|password|secret|auth/);
  });
});

describe("deletion confirmation", () => {
  it("accepts the word in any case, with spaces around", () => {
    expect(isDeleteConfirmed(DELETE_CONFIRMATION)).toBe(true);
    expect(isDeleteConfirmed("  supprimer ")).toBe(true);
  });
  it("refuses anything else", () => {
    for (const typed of ["", "oui", "SUPPRIME", "SUPPRIMER mon compte"]) {
      expect(isDeleteConfirmed(typed)).toBe(false);
    }
  });
});
