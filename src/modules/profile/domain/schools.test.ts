import { describe, expect, it } from "vitest";
import { describeSchool, mySchoolSchema, normalizeSearch, schoolSearchSchema } from "./schools";

describe("normalizeSearch", () => {
  it("removes accents, capitals and punctuation", () => {
    expect(normalizeSearch("  Lycée Saint-Exupéry, Valserhône ")).toBe("lycee saint exupery valserhone");
    expect(normalizeSearch("Université Paris-Saclay")).toBe("universite paris saclay");
  });
});

describe("schoolSearchSchema", () => {
  it("normalises the query and defaults to every kind", () => {
    const parsed = schoolSearchSchema.parse({ query: "  Éco  " });
    expect(parsed).toEqual({ query: "eco", kind: null });
  });
  it("rejects a query that is too short once normalised", () => {
    expect(schoolSearchSchema.safeParse({ query: " é " }).success).toBe(false);
    expect(schoolSearchSchema.safeParse({ query: "x".repeat(81) }).success).toBe(false);
  });
  it("rejects an unknown kind", () => {
    expect(schoolSearchSchema.safeParse({ query: "paris", kind: "collège" }).success).toBe(false);
  });
});

describe("mySchoolSchema", () => {
  it("accepts a UAI code or null, nothing else", () => {
    expect(mySchoolSchema.safeParse({ schoolId: "0920894X" }).success).toBe(true);
    expect(mySchoolSchema.safeParse({ schoolId: null }).success).toBe(true);
    expect(mySchoolSchema.safeParse({ schoolId: "x'; drop" }).success).toBe(false);
  });
});

describe("describeSchool", () => {
  it("joins place and status", () => {
    expect(describeSchool({ city: "Bagneux", department: "Hauts-de-Seine", isPublic: false })).toBe(
      "Bagneux, Hauts-de-Seine · privé",
    );
    expect(describeSchool({ city: null, department: null, isPublic: null })).toBe("");
  });
});
