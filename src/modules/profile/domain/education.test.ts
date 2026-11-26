import { describe, expect, it } from "vitest";
import {
  educationAnswersSchema,
  educationDetailsSchema,
  GENDER_LABELS,
  GENDERS,
  STUDY_LEVEL_LABELS,
  STUDY_LEVELS,
} from "./education";

describe("education answers", () => {
  it("accepts every answer left empty (everything is optional)", () => {
    expect(educationAnswersSchema.safeParse({ schoolId: null, studyLevel: null, gender: null }).success).toBe(
      true,
    );
  });

  it("accepts the known values and refuses anything else", () => {
    expect(
      educationAnswersSchema.safeParse({
        schoolId: "0920894X",
        studyLevel: "terminale",
        gender: "prefer_not",
      }).success,
    ).toBe(true);
    expect(educationDetailsSchema.safeParse({ studyLevel: "doctorat", gender: null }).success).toBe(false);
    expect(educationDetailsSchema.safeParse({ studyLevel: null, gender: "x" }).success).toBe(false);
    expect(
      educationAnswersSchema.safeParse({ schoolId: "<script>", studyLevel: null, gender: null }).success,
    ).toBe(false);
  });

  it("has a French label for every value, and the same values as the database checks", () => {
    expect(Object.keys(STUDY_LEVEL_LABELS).sort()).toEqual([...STUDY_LEVELS].sort());
    expect(Object.keys(GENDER_LABELS).sort()).toEqual([...GENDERS].sort());
    // Kept in step with supabase/migrations/20261126130000_education_details.sql.
    expect([...STUDY_LEVELS]).toEqual([
      "seconde",
      "premiere",
      "terminale",
      "bac1",
      "bac2",
      "bac3",
      "master",
      "other",
    ]);
    expect([...GENDERS]).toEqual(["female", "male", "non_binary", "prefer_not"]);
  });
});
