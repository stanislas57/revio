import { describe, expect, it } from "vitest";
import { AUDIENCE_TITLES, groupByAudience, MY_DATA } from "./my-data";

const byId = (id: string) => MY_DATA.find((d) => d.id === id);

describe("the 'Mes données' list", () => {
  it("never shares grades, subjects, exams, the e-mail or the settings (decision D-16)", () => {
    for (const id of ["email", "academic", "settings", "private-sessions"]) {
      expect(byId(id)?.audience, id).toBe("me");
    }
  });

  it("shows a friendship only to the two people concerned", () => {
    expect(byId("friends")?.audience).toBe("involved");
  });

  it("makes only the public identity visible to every signed-in user", () => {
    const wide = MY_DATA.filter((d) => d.audience === "signed-in").map((d) => d.id);
    expect(wide).toEqual(["identity"]);
  });

  it("has unique ids and a plain-language label and detail for each row", () => {
    expect(new Set(MY_DATA.map((d) => d.id)).size).toBe(MY_DATA.length);
    for (const d of MY_DATA) {
      expect(d.label.length).toBeGreaterThan(5);
      expect(d.detail.endsWith(".")).toBe(true);
    }
  });

  it("groups by audience, widest first, without losing a row", () => {
    const groups = groupByAudience(MY_DATA);
    expect(groups.map((g) => g.audience)).toEqual(["signed-in", "friends", "involved", "me"]);
    expect(groups.flatMap((g) => g.items)).toHaveLength(MY_DATA.length);
    for (const g of groups) expect(AUDIENCE_TITLES[g.audience]).toBeTruthy();
  });
});
