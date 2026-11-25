import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "./routes";

describe("routes", () => {
  it("detects protected paths", () => {
    expect(isProtectedPath("/accueil")).toBe(true);
    expect(isProtectedPath("/focus/123")).toBe(true);
    expect(isProtectedPath("/apercu/fiches")).toBe(true);
    expect(isProtectedPath("/connexion")).toBe(false);
    expect(isProtectedPath("/accueillir")).toBe(false);
  });

  it("only allows same-site relative redirects", () => {
    expect(safeNextPath("/social")).toBe("/social");
    expect(safeNextPath("https://evil.example")).toBe("/accueil");
    expect(safeNextPath("//evil.example")).toBe("/accueil");
    expect(safeNextPath("/\\evil.example")).toBe("/accueil");
    expect(safeNextPath(null)).toBe("/accueil");
  });
});
