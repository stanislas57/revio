import { describe, expect, it } from "vitest";
import { displayName, initials } from "./names";

describe("displayName", () => {
  it("prefers the display name", () => {
    expect(displayName({ display_name: "Stani", username: "stan" })).toBe("Stani");
  });
  it("falls back to @username, then a neutral label", () => {
    expect(displayName({ display_name: " ", username: "stan" })).toBe("@stan");
    expect(displayName({ display_name: "", username: null })).toBe("Étudiant Revio");
  });
});

describe("initials", () => {
  it("builds initials", () => {
    expect(initials({ display_name: "Charles Martin" })).toBe("CM");
    expect(initials({ display_name: "", username: "stani_h" })).toBe("SH");
    expect(initials({ display_name: "Louis" })).toBe("LO");
  });
});
