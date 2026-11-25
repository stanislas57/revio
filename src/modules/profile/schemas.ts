import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).max(254),
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(72, { error: "Mot de passe trop long." }),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/** Both fields are optional (partial update); at least one must be present. */
export const profileUpdateSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{3,24}$/, { error: "Pseudo : 3 à 24 caractères, minuscules, chiffres ou _." })
      .optional(),
    displayName: z.string().trim().max(60, { error: "Nom affiché : 60 caractères maximum." }).optional(),
  })
  .refine((v) => v.username !== undefined || v.displayName !== undefined, { error: "Rien à modifier." })
  .transform((v) => ({
    ...(v.username !== undefined ? { username: v.username } : {}),
    ...(v.displayName !== undefined ? { display_name: v.displayName } : {}),
  }));
