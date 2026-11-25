import "server-only";
import type { z } from "zod";
import { fail } from "@/lib/action-errors";
import type { ActionResult } from "@/lib/contracts";

/** Parses with Zod; on failure returns a ready-to-return `validation` ActionResult. */
export function validate<S extends z.ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.output<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const field = String(issue?.path[0] ?? "");
  return {
    ok: false,
    result: fail({
      code: "validation",
      message: issue?.message ?? "Données invalides.",
      ...(field ? { fields: { [field]: issue?.message ?? "Valeur invalide." } } : {}),
    }),
  };
}
