import { describe, expect, it } from "vitest";
import { initials, userLabel } from "./names";

describe("userLabel", () => {
  it("prefers the display name", () => {
    expect(userLabel({ displayName: "Stani", username: "stan" })).toBe("Stani");
  });
  it("falls back to @username, then a neutral label", () => {
    expect(userLabel({ displayName: " ", username: "stan" })).toBe("@stan");
    expect(userLabel({ displayName: "", username: null })).toBe("Étudiant Revio");
  });
});

describe("initials", () => {
  it("builds initials", () => {
    expect(initials({ displayName: "Charles Martin", username: null })).toBe("CM");
    expect(initials({ displayName: "", username: "stani_h" })).toBe("SH");
    expect(initials({ displayName: "Louis", username: null })).toBe("LO");
  });
});
