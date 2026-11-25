import { z } from "zod";
import { addDays, isIsoDate } from "./domain/dates";
import { EVENT_KINDS, RECURRENCES, VIEWS } from "./domain/types";

const isoDate = z.string().refine(isIsoDate, { error: "Date invalide." });
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Heure invalide (HH:MM)." });
const optionalTime = z
  .union([time, z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Titre obligatoire." })
      .max(120, { error: "120 caractères maximum." }),
    kind: z.enum(EVENT_KINDS, { error: "Type invalide." }),
    subjectId: z
      .uuid()
      .nullish()
      .transform((v) => v ?? null),
    startsOn: isoDate,
    startTime: optionalTime,
    endTime: optionalTime,
    recurrence: z.enum(RECURRENCES, { error: "Répétition invalide." }),
    /** Last day of a repeating series; ignored when it does not repeat. */
    repeatUntil: z
      .union([isoDate, z.literal("")])
      .nullish()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((e, ctx) => {
    if ((e.startTime === null) !== (e.endTime === null)) {
      ctx.addIssue({
        code: "custom",
        path: [e.startTime === null ? "startTime" : "endTime"],
        message: "Renseigne l'heure de début et de fin, ou aucune (toute la journée).",
      });
    } else if (e.startTime !== null && e.endTime !== null && e.endTime <= e.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "La fin doit être après le début." });
    }
    if (e.recurrence !== "none") {
      if (e.repeatUntil === null) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatUntil"],
          message: "Choisis la date de fin de la série.",
        });
      } else if (e.repeatUntil < e.startsOn) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatUntil"],
          message: "La fin de la série est avant son début.",
        });
      } else if (e.repeatUntil > addDays(e.startsOn, 366)) {
        ctx.addIssue({ code: "custom", path: ["repeatUntil"], message: "Une série dure un an au maximum." });
      }
    }
  });
export type EventInput = z.input<typeof eventSchema>;

export const idSchema = z.uuid({ error: "Identifiant invalide." });

/** URL search params of the agenda page; anything invalid falls back to the defaults. */
export const viewParamsSchema = z.object({
  vue: z.enum(VIEWS).catch("semaine"),
  date: isoDate.optional().catch(undefined),
});
