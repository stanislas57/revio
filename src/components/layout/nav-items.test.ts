import { describe, expect, it } from "vitest";
import { activeNavHref, NAV_ITEMS } from "./nav-items";

describe("activeNavHref", () => {
  it("picks the exact entry", () => {
    expect(activeNavHref("/social", NAV_ITEMS)).toBe("/social");
    expect(activeNavHref("/profil", NAV_ITEMS)).toBe("/profil");
  });

  it("prefers the longest matching route for a sub-page", () => {
    expect(activeNavHref("/profil/statistiques", NAV_ITEMS)).toBe("/profil/statistiques");
    expect(activeNavHref("/social/classement", NAV_ITEMS)).toBe("/social/classement");
    expect(activeNavHref("/social/amis/42", NAV_ITEMS)).toBe("/social");
    expect(activeNavHref("/profil/trophees", NAV_ITEMS)).toBe("/profil");
  });

  it("falls back to the parent when the sub-page has no entry in the list (mobile bar)", () => {
    const mobile = NAV_ITEMS.filter((i) => i.mobileLabel);
    expect(activeNavHref("/profil/statistiques", mobile)).toBe("/profil");
    expect(activeNavHref("/social/classement", mobile)).toBe("/social");
  });

  it("does not match a route that only shares a prefix", () => {
    expect(activeNavHref("/profilx", NAV_ITEMS)).toBe("");
    expect(activeNavHref("/apercu", NAV_ITEMS)).toBe("");
  });

  it("keeps exactly four entries for the mobile bar", () => {
    expect(NAV_ITEMS.filter((i) => i.mobileLabel)).toHaveLength(4);
  });
});
