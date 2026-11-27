import { describe, expect, it } from "vitest";
import {
  DEFAULT_NAV_LAYOUT,
  isNavLayout,
  NAV_LAYOUT_LABELS,
  NAV_LAYOUTS,
  navLayoutSchema,
} from "./nav-layout";

describe("nav layout", () => {
  it("accepts the two layouts only", () => {
    expect(NAV_LAYOUTS).toEqual(["sidebar", "top"]);
    expect(isNavLayout("sidebar")).toBe(true);
    expect(isNavLayout("top")).toBe(true);
    for (const bad of ["bottom", "", "TOP", null, undefined, 3]) expect(isNavLayout(bad)).toBe(false);
    expect(navLayoutSchema.safeParse("left").success).toBe(false);
  });

  it("defaults to the sidebar and has a label for each layout", () => {
    expect(DEFAULT_NAV_LAYOUT).toBe("sidebar");
    for (const layout of NAV_LAYOUTS) expect(NAV_LAYOUT_LABELS[layout].title).toBeTruthy();
  });
});
