import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDER, describeReminder, isValidReminderTime, REMINDER_DAYS } from "./reminders";

describe("reminder mock-up", () => {
  it("accepts HH:MM times only", () => {
    for (const ok of ["00:00", "07:30", "18:00", "23:59"]) expect(isValidReminderTime(ok), ok).toBe(true);
    for (const bad of ["", "24:00", "7:30", "18:60", "18h00", "abc"])
      expect(isValidReminderTime(bad), bad).toBe(false);
  });

  it("describes every kind of selection in French", () => {
    expect(describeReminder("18:00", [1, 2, 3, 4, 5, 6, 7])).toBe("Un rappel chaque jour à 18 h 00.");
    expect(describeReminder("18:00", [1, 2, 3, 4, 5])).toBe("Un rappel du lundi au vendredi à 18 h 00.");
    expect(describeReminder("07:30", [3])).toBe("Un rappel le mercredi à 07 h 30.");
    expect(describeReminder("20:15", [1, 3, 5])).toBe("Un rappel : lundi, mercredi et vendredi, à 20 h 15.");
    expect(describeReminder("18:00", [])).toBe("Aucun jour choisi : aucun rappel.");
    expect(describeReminder("99:99", [1])).toBe("Choisis une heure valide.");
  });

  it("lists the seven days Monday first, with the default on weekdays", () => {
    expect(REMINDER_DAYS.map((d) => d.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(DEFAULT_REMINDER.days).toEqual([1, 2, 3, 4, 5]);
  });
});
