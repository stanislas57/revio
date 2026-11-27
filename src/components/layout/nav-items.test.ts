import { describe, expect, it } from "vitest";
import { activeNavHref, NAV_ITEMS, PROFILE_HREF } from "./nav-items";

describe("the menu", () => {
  it("has the four entries of the design, in order", () => {
    expect(NAV_ITEMS.map((i) => [i.label, i.href])).toEqual([
      ["Accueil", "/accueil"],
      ["Social", "/social"],
      ["Notes", "/notes"],
      ["Agenda", "/agenda"],
    ]);
  });

  it("gives Notes its four sub-pages, the first one being « Mes notes » itself", () => {
    const notes = NAV_ITEMS.find((i) => i.href === "/notes");
    expect(notes?.children?.map((c) => c.href)).toEqual([
      "/notes",
      "/notes/simulateur",
      "/notes/temps",
      "/notes/importer",
    ]);
  });

  it("leads to the profile from the sidebar card and the avatar, not from an entry", () => {
    expect(PROFILE_HREF).toBe("/profil");
    expect(NAV_ITEMS.some((i) => i.href === PROFILE_HREF)).toBe(false);
  });
});

describe("activeNavHref", () => {
  it("picks the exact entry", () => {
    expect(activeNavHref("/social", NAV_ITEMS)).toBe("/social");
    expect(activeNavHref("/notes", NAV_ITEMS)).toBe("/notes");
  });

  it("keeps a sub-page on its entry", () => {
    expect(activeNavHref("/notes/simulateur", NAV_ITEMS)).toBe("/notes");
    expect(activeNavHref("/social/classement", NAV_ITEMS)).toBe("/social");
    expect(activeNavHref("/social/amis/42", NAV_ITEMS)).toBe("/social");
  });

  it("finds the current sub-page of an entry by the longest route", () => {
    const children = NAV_ITEMS.find((i) => i.href === "/notes")!.children!;
    expect(activeNavHref("/notes", children)).toBe("/notes");
    expect(activeNavHref("/notes/temps", children)).toBe("/notes/temps");
    expect(activeNavHref("/notes/importer", children)).toBe("/notes/importer");
  });

  it("marks no entry on the pages that have none (profile, statistics, Focus)", () => {
    for (const path of ["/profil", "/profil/statistiques", "/profil/trophees", "/focus", "/apercu"]) {
      expect(activeNavHref(path, NAV_ITEMS)).toBe("");
    }
  });

  it("does not match a route that only shares a prefix", () => {
    expect(activeNavHref("/notesx", NAV_ITEMS)).toBe("");
  });
});
