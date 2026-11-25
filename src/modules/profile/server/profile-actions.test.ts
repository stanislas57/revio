import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

type UpdateResult = { data: unknown; error: { code?: string; message: string } | null };
let updateResult: UpdateResult;
const updateSpy = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireUser: async () => ({
    user: { id: "u1", email: "a@b.test" },
    supabase: {
      from: (table: string) => {
        if (table === "user_settings") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
        }
        return {
          update: (values: unknown) => {
            updateSpy(values);
            return { eq: () => ({ select: () => ({ single: async () => updateResult }) }) };
          },
        };
      },
    },
  }),
}));

import { updateProfile } from "./profile-actions";

beforeEach(() => {
  updateSpy.mockClear();
  updateResult = {
    data: { id: "u1", username: "alice_42", display_name: "", avatar_url: null },
    error: null,
  };
});

describe("updateProfile as used by the username screen", () => {
  it("saves a valid username, lowercased, and no longer asks for one", async () => {
    const res = await updateProfile({ username: "Alice_42" });
    expect(updateSpy).toHaveBeenCalledWith({ username: "alice_42" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.needsUsername).toBe(false);
  });

  it.each(["a!", "ab", "avec espace", "é", "x".repeat(25), ""])(
    "refuses the invalid username %j in French, without touching the database",
    async (username) => {
      const res = await updateProfile({ username });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.message).toBe("Pseudo : 3 à 24 caractères, minuscules, chiffres ou _.");
      expect(updateSpy).not.toHaveBeenCalled();
    },
  );

  it("tells the user the username is taken (unique violation 23505)", async () => {
    updateResult = { data: null, error: { code: "23505", message: "duplicate key value" } };
    const res = await updateProfile({ username: "deja_pris" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("Ce pseudo est déjà pris.");
  });
});
