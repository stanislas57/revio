/**
 * Text of the settings screen in French (the source), English and Spanish. A plain typed object:
 * TypeScript refuses a language that misses a key, and a test checks that nothing is empty or
 * left untranslated. Only this screen is translated for now.
 */

import type { Locale } from "./locale";

export type SettingsMessages = {
  title: string;
  description: string;
  /** Shown under the language selector. */
  languageNote: string;
  timezone: string;
  timezoneHelp: string;
  goal: string;
  goalHelp: (min: number, max: number) => string;
  sharingLegend: string;
  autoPostTitle: string;
  autoPostHelp: string;
  shareSubjectTitle: string;
  shareSubjectHelp: string;
  shareByDefaultTitle: string;
  shareByDefaultHelp: string;
  liveStatusTitle: string;
  liveStatusHelp: string;
  save: string;
  saving: string;
  saved: string;
  appliesNext: string;
  /** Labels of the offered time zones, by IANA name. */
  zones: Readonly<Record<string, string>>;
  errors: {
    goalNumber: string;
    goalInteger: string;
    goalMin: (min: number) => string;
    goalMax: (max: number) => string;
    timezoneUnknown: string;
    timezoneInvalid: string;
    invalid: string;
    outOfRange: string;
    unexpected: string;
  };
};

const fr: SettingsMessages = {
  title: "Réglages",
  description:
    "Privés : seuls toi et le serveur y avez accès. Ta matière n'est jamais partagée sans ton accord.",
  languageNote: "Seul cet écran est traduit pour l'instant.",
  timezone: "Fuseau horaire",
  timezoneHelp: "Tes jours (série, objectif du jour) commencent et finissent à minuit dans ce fuseau.",
  goal: "Objectif du jour (minutes)",
  goalHelp: (min, max) =>
    `Entre ${min} et ${max} minutes. L'atteindre rapporte un bonus d'XP une fois par jour.`,
  sharingLegend: "Partage avec tes amis",
  autoPostTitle: "Publier mes séances dans le fil",
  autoPostHelp: "Quand une séance partagée se termine, elle apparaît dans le fil de tes amis.",
  shareSubjectTitle: "Montrer le nom de ma matière",
  shareSubjectHelp:
    "Désactivé par défaut : tes amis ne voient jamais ta matière sans ton accord. Tes notes ne sont jamais partagées.",
  shareByDefaultTitle: "Partager mes séances par défaut",
  shareByDefaultHelp:
    "À chaque nouvelle séance, la case « Partager avec mes amis » est cochée. Tu peux la décocher séance par séance.",
  liveStatusTitle: "Montrer « en révision » à mes amis",
  liveStatusHelp:
    "Désactivé : tes amis ne voient pas que tu révises en ce moment. Ils voient seulement les séances terminées que tu as partagées.",
  save: "Enregistrer les réglages",
  saving: "Enregistrement…",
  saved: "Réglages enregistrés.",
  appliesNext: "Les réglages s'appliquent à ta prochaine séance terminée.",
  zones: {
    "Europe/Paris": "France métropolitaine (Paris)",
    "America/Martinique": "Martinique, Guadeloupe",
    "America/Cayenne": "Guyane",
    "Indian/Reunion": "La Réunion",
    "Indian/Mayotte": "Mayotte",
    "Pacific/Noumea": "Nouvelle-Calédonie",
    "Pacific/Tahiti": "Polynésie française (Tahiti)",
    "Europe/Brussels": "Belgique (Bruxelles)",
    "Europe/Zurich": "Suisse (Zurich)",
    "Europe/London": "Royaume-Uni (Londres)",
    "America/Montreal": "Québec (Montréal)",
    UTC: "Temps universel (UTC)",
  },
  errors: {
    goalNumber: "L'objectif doit être un nombre.",
    goalInteger: "L'objectif doit être un nombre entier de minutes.",
    goalMin: (min) => `L'objectif doit être d'au moins ${min} minutes.`,
    goalMax: (max) => `L'objectif ne peut pas dépasser ${max} minutes.`,
    timezoneUnknown: "Fuseau horaire inconnu.",
    timezoneInvalid: "Fuseau horaire invalide.",
    invalid: "Réglages invalides.",
    outOfRange: "Réglage hors des valeurs autorisées.",
    unexpected: "Réponse inattendue du serveur.",
  },
};

const en: SettingsMessages = {
  title: "Settings",
  description:
    "Private: only you and the server can see them. Your subject is never shared without your consent.",
  languageNote: "Only this screen is translated for now.",
  timezone: "Time zone",
  timezoneHelp: "Your days (streak, daily goal) start and end at midnight in this time zone.",
  goal: "Daily goal (minutes)",
  goalHelp: (min, max) => `Between ${min} and ${max} minutes. Reaching it earns an XP bonus once a day.`,
  sharingLegend: "Sharing with your friends",
  autoPostTitle: "Post my sessions to the feed",
  autoPostHelp: "When a shared session ends, it appears in your friends' feed.",
  shareSubjectTitle: "Show my subject name",
  shareSubjectHelp:
    "Off by default: your friends never see your subject without your consent. Your grades are never shared.",
  shareByDefaultTitle: "Share my sessions by default",
  shareByDefaultHelp:
    'For each new session, the "Share with my friends" box is ticked. You can untick it session by session.',
  liveStatusTitle: 'Show "studying now" to my friends',
  liveStatusHelp:
    "Off: your friends cannot see that you are studying right now. They only see the finished sessions you shared.",
  save: "Save settings",
  saving: "Saving…",
  saved: "Settings saved.",
  appliesNext: "Settings apply to your next finished session.",
  zones: {
    "Europe/Paris": "Mainland France (Paris)",
    "America/Martinique": "Martinique, Guadeloupe",
    "America/Cayenne": "French Guiana",
    "Indian/Reunion": "Réunion",
    "Indian/Mayotte": "Mayotte",
    "Pacific/Noumea": "New Caledonia",
    "Pacific/Tahiti": "French Polynesia (Tahiti)",
    "Europe/Brussels": "Belgium (Brussels)",
    "Europe/Zurich": "Switzerland (Zurich)",
    "Europe/London": "United Kingdom (London)",
    "America/Montreal": "Quebec (Montreal)",
    UTC: "Coordinated Universal Time (UTC)",
  },
  errors: {
    goalNumber: "The goal must be a number.",
    goalInteger: "The goal must be a whole number of minutes.",
    goalMin: (min) => `The goal must be at least ${min} minutes.`,
    goalMax: (max) => `The goal cannot exceed ${max} minutes.`,
    timezoneUnknown: "Unknown time zone.",
    timezoneInvalid: "Invalid time zone.",
    invalid: "Invalid settings.",
    outOfRange: "Setting outside the allowed values.",
    unexpected: "Unexpected server response.",
  },
};

const es: SettingsMessages = {
  title: "Ajustes",
  description:
    "Privados: solo tú y el servidor pueden verlos. Tu asignatura nunca se comparte sin tu permiso.",
  languageNote: "Por ahora, solo esta pantalla está traducida.",
  timezone: "Zona horaria",
  timezoneHelp: "Tus días (racha, objetivo diario) empiezan y terminan a medianoche en esta zona horaria.",
  goal: "Objetivo diario (minutos)",
  goalHelp: (min, max) => `Entre ${min} y ${max} minutos. Alcanzarlo da un bonus de XP una vez al día.`,
  sharingLegend: "Compartir con tus amigos",
  autoPostTitle: "Publicar mis sesiones en el feed",
  autoPostHelp: "Cuando termina una sesión compartida, aparece en el feed de tus amigos.",
  shareSubjectTitle: "Mostrar el nombre de mi asignatura",
  shareSubjectHelp:
    "Desactivado por defecto: tus amigos nunca ven tu asignatura sin tu permiso. Tus notas nunca se comparten.",
  shareByDefaultTitle: "Compartir mis sesiones por defecto",
  shareByDefaultHelp:
    "En cada sesión nueva, la casilla «Compartir con mis amigos» está marcada. Puedes desmarcarla sesión por sesión.",
  liveStatusTitle: "Mostrar «estudiando ahora» a mis amigos",
  liveStatusHelp:
    "Desactivado: tus amigos no ven que estás estudiando ahora. Solo ven las sesiones terminadas que compartiste.",
  save: "Guardar ajustes",
  saving: "Guardando…",
  saved: "Ajustes guardados.",
  appliesNext: "Los ajustes se aplican a tu próxima sesión terminada.",
  zones: {
    "Europe/Paris": "Francia metropolitana (París)",
    "America/Martinique": "Martinica, Guadalupe",
    "America/Cayenne": "Guayana Francesa",
    "Indian/Reunion": "Reunión",
    "Indian/Mayotte": "Mayotte",
    "Pacific/Noumea": "Nueva Caledonia",
    "Pacific/Tahiti": "Polinesia Francesa (Tahití)",
    "Europe/Brussels": "Bélgica (Bruselas)",
    "Europe/Zurich": "Suiza (Zúrich)",
    "Europe/London": "Reino Unido (Londres)",
    "America/Montreal": "Quebec (Montreal)",
    UTC: "Tiempo universal (UTC)",
  },
  errors: {
    goalNumber: "El objetivo debe ser un número.",
    goalInteger: "El objetivo debe ser un número entero de minutos.",
    goalMin: (min) => `El objetivo debe ser de al menos ${min} minutos.`,
    goalMax: (max) => `El objetivo no puede superar los ${max} minutos.`,
    timezoneUnknown: "Zona horaria desconocida.",
    timezoneInvalid: "Zona horaria no válida.",
    invalid: "Ajustes no válidos.",
    outOfRange: "Ajuste fuera de los valores permitidos.",
    unexpected: "Respuesta inesperada del servidor.",
  },
};

export const SETTINGS_MESSAGES: Readonly<Record<Locale, SettingsMessages>> = { fr, en, es };
