import { describe, expect, it } from "vitest";
import { notificationText, unreadCount } from "./notifications";

describe("notifications", () => {
  it("has a sentence for every kind, none mentioning grades or subjects", () => {
    for (const kind of ["friend_request", "friend_accepted", "post_reaction"] as const) {
      const text = notificationText({ kind });
      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toMatch(/note|moyenne|matière/i);
    }
  });
  it("counts unread ones", () => {
    expect(unreadCount([{ read: false }, { read: true }, { read: false }])).toBe(2);
    expect(unreadCount([])).toBe(0);
  });
});
