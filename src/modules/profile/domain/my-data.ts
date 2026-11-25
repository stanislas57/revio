/**
 * What Revio keeps about a user and who can see it, in plain language (the "Mes données" section).
 * Every row mirrors the database as it is today (supabase/migrations, RLS policies); when a table or a
 * policy changes, this list must change too. The wording is NOT legal text: it still has to be
 * reviewed (see the pull request that introduced it).
 */

/** Who can read the data: only me, the people concerned, my accepted friends, or any signed-in user. */
export type Audience = "me" | "involved" | "friends" | "signed-in";

export type DataItem = {
  id: string;
  label: string;
  detail: string;
  audience: Audience;
};

export const MY_DATA: readonly DataItem[] = [
  {
    id: "email",
    label: "Ton adresse e-mail",
    detail: "Sert à te connecter. Elle n'est jamais affichée aux autres.",
    audience: "me",
  },
  {
    id: "identity",
    label: "Ton pseudo et ton nom affiché",
    detail: "Les autres utilisateurs connectés les voient, pour pouvoir te trouver et t'ajouter.",
    audience: "signed-in",
  },
  {
    id: "progress",
    label: "Ton niveau, ton XP total, ta série et ton temps révisé",
    detail: "Visibles par tes amis acceptés.",
    audience: "friends",
  },
  {
    id: "sessions",
    label: "Tes séances Focus partagées et les publications du fil",
    detail:
      "Durée, XP gagné, série, et la matière seulement si tu choisis de la montrer. Tes amis peuvent répondre par un « Bravo ».",
    audience: "friends",
  },
  {
    id: "friends",
    label: "Tes amitiés et tes demandes d'amis",
    detail: "Chaque amitié ou demande n'est visible que par les deux personnes concernées.",
    audience: "involved",
  },
  {
    id: "private-sessions",
    label: "Tes séances non partagées et le détail de tes XP",
    detail: "Heure de début et de fin, historique des gains. Réservés à toi.",
    audience: "me",
  },
  {
    id: "academic",
    label: "Tes matières, tes notes, tes examens et ton objectif de moyenne",
    detail: "Jamais visibles par un autre utilisateur, même un ami.",
    audience: "me",
  },
  {
    id: "settings",
    label: "Tes réglages",
    detail: "Fuseau horaire, objectif du jour, publication automatique, partage de la matière.",
    audience: "me",
  },
];

export const AUDIENCE_TITLES: Record<Audience, string> = {
  "signed-in": "Visible par les autres utilisateurs connectés",
  friends: "Visible par tes amis",
  involved: "Visible par les personnes concernées",
  me: "Visible par toi seul",
};

/** Display order: the widest audience first, so nothing public hides behind the private items. */
export const AUDIENCE_ORDER: readonly Audience[] = ["signed-in", "friends", "involved", "me"];

export function groupByAudience(items: readonly DataItem[]): { audience: Audience; items: DataItem[] }[] {
  return AUDIENCE_ORDER.map((audience) => ({
    audience,
    items: items.filter((item) => item.audience === audience),
  })).filter((group) => group.items.length > 0);
}

/** Never collected: said out loud, because it is what a minor (or a parent) wants to know. */
export const NOT_COLLECTED =
  "Revio ne te demande ni date de naissance, ni adresse, ni numéro de téléphone : seulement un e-mail et un mot de passe.";
