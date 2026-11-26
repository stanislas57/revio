import { describe, expect, it } from "vitest";
import { toActionError } from "./action-errors";

describe("toActionError", () => {
  it("maps known Postgres codes", () => {
    expect(toActionError({ code: "23505" }).code).toBe("conflict");
    expect(toActionError({ code: "P0002" }).code).toBe("not_found");
    expect(toActionError({ code: "42501" }).code).toBe("unauthenticated");
    expect(toActionError({ code: "23503" }).code).toBe("validation");
  });

  it("never leaks the database message", () => {
    const e = toActionError({ code: "XX000", message: "relation secret_table does not exist" });
    expect(e.code).toBe("internal");
    expect(e.message).not.toContain("secret_table");
  });

  it("accepts a custom message per code", () => {
    expect(toActionError({ code: "23505" }, { "23505": "Une séance est déjà en cours." }).message).toBe(
      "Une séance est déjà en cours.",
    );
  });
});
