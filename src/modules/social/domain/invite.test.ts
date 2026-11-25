import { describe, expect, it } from "vitest";
import { inviteMessage } from "./invite";

describe("inviteMessage", () => {
  it("contains the username, so a friend can search for it", () => {
    expect(inviteMessage("alice_42")).toContain("alice_42");
  });

  it("contains no link and no e-mail address (no magic link, nothing to leak)", () => {
    const text = inviteMessage("alice_42");
    expect(text).not.toMatch(/https?:|www\.|@/);
  });

  it("is in French and short enough for a text message", () => {
    const text = inviteMessage("a".repeat(24));
    expect(text).toMatch(/Ajouter un ami/);
    expect(text.length).toBeLessThan(280);
  });
});
