import { describe, expect, it } from "vitest";
import { toLeaderboardEntry } from "./mappers";

describe("toLeaderboardEntry", () => {
  it("maps a database row to a leaderboard entry (XP only)", () => {
    const entry = toLeaderboardEntry({
      user_id: "u1",
      username: "lea",
      display_name: "Léa",
      avatar_url: null,
      weekly_xp: 120,
      rank: 2,
      is_me: true,
    });
    expect(entry).toEqual({
      rank: 2,
      user: { id: "u1", username: "lea", displayName: "Léa", avatarUrl: null },
      weeklyXp: 120,
      isMe: true,
    });
  });
});
