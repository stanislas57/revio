/**
 * Mock-up of the daily reminder (not stored, not sent: no table, no scheduled task, no consent exists
 * yet). Days follow ISO order, Monday first.
 */
export const REMINDER_DAYS = [
  { id: 1, short: "Lun", long: "lundi" },
  { id: 2, short: "Mar", long: "mardi" },
  { id: 3, short: "Mer", long: "mercredi" },
  { id: 4, short: "Jeu", long: "jeudi" },
  { id: 5, short: "Ven", long: "vendredi" },
  { id: 6, short: "Sam", long: "samedi" },
  { id: 7, short: "Dim", long: "dimanche" },
] as const;

export const DEFAULT_REMINDER = { time: "18:00", days: [1, 2, 3, 4, 5] as number[] };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidReminderTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** One sentence that says what the reminder would do, for the preview. */
export function describeReminder(time: string, days: readonly number[]): string {
  if (!isValidReminderTime(time)) return "Choisis une heure valide.";
  const chosen = REMINDER_DAYS.filter((d) => days.includes(d.id));
  if (chosen.length === 0) return "Aucun jour choisi : aucun rappel.";
  const at = time.replace(":", " h ");
  if (chosen.length === 7) return `Un rappel chaque jour à ${at}.`;
  if (chosen.length === 5 && chosen.every((d) => d.id <= 5)) {
    return `Un rappel du lundi au vendredi à ${at}.`;
  }
  const names = chosen.map((d) => d.long);
  if (names.length === 1) return `Un rappel le ${names[0]} à ${at}.`;
  return `Un rappel : ${names.slice(0, -1).join(", ")} et ${names.at(-1)}, à ${at}.`;
}
