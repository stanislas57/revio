import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }).max(254),
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(72, { error: "Mot de passe trop long." }),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, {
      error: "Pseudo : 3 à 24 caractères, lettres minuscules, chiffres ou _.",
    }),
  displayName: z.string().trim().max(60, { error: "Nom affiché : 60 caractères maximum." }),
});
