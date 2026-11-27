import { describe, expect, it } from "vitest";
import { needsOnboarding } from "./onboarding";

describe("needsOnboarding", () => {
  it("shows the onboarding only when it is known to be not done", () => {
    expect(needsOnboarding({ onboardingDone: false, unavailable: false }, false)).toBe(true);
    expect(needsOnboarding({ onboardingDone: true, unavailable: false }, false)).toBe(false);
  });

  it("never counts a failed read as « not done »", () => {
    expect(needsOnboarding({ onboardingDone: false, unavailable: true }, false)).toBe(false);
  });

  it("lets in someone who continued without saving", () => {
    expect(needsOnboarding({ onboardingDone: false, unavailable: false }, true)).toBe(false);
  });
});
