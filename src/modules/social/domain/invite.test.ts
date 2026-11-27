import { describe, expect, it } from "vitest";
import { inviteMessage, inviteUrl, isInviteCode, shareLink } from "./invite";

describe("invite code", () => {
  it("is a username: 3 to 24 lowercase letters, digits or underscores", () => {
    for (const ok of ["abc", "stan_57", "a1b2c3", "x".repeat(24)]) expect(isInviteCode(ok)).toBe(true);
    for (const bad of ["ab", "x".repeat(25), "Stan", "a b", "a-b", "é_é_é", "../etc", "a?b=1", "<script>"])
      expect(isInviteCode(bad)).toBe(false);
  });
});

describe("inviteUrl", () => {
  it("builds the link from the origin, with or without a trailing slash", () => {
    expect(inviteUrl("https://revio.example", "stan_57")).toBe("https://revio.example/invite/stan_57");
    expect(inviteUrl("https://revio.example/", "stan_57")).toBe("https://revio.example/invite/stan_57");
  });
});

describe("inviteMessage", () => {
  it("carries the link and the username as a fallback, and works without a link", () => {
    const m = inviteMessage("stan_57", "https://revio.example/invite/stan_57");
    expect(m).toContain("https://revio.example/invite/stan_57");
    expect(m).toContain("stan_57");
    expect(inviteMessage("stan_57")).not.toContain("http");
  });
});

describe("shareLink", () => {
  const url = "https://revio.example/invite/stan_57";
  it("builds the public share links, encoded", () => {
    expect(shareLink("whatsapp", url, "Salut & bienvenue")).toBe(
      `https://wa.me/?text=${encodeURIComponent(`Salut & bienvenue\n${url}`)}`,
    );
    expect(shareLink("sms", url, "Salut")).toBe(`sms:?&body=${encodeURIComponent(`Salut ${url}`)}`);
    expect(shareLink("snapchat", url, "")).toBe(
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    );
  });

  it("never lets the text break out of the link", () => {
    expect(shareLink("whatsapp", url, "a&b=c#d")).not.toMatch(/&b=c#d/);
  });
});
