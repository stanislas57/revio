import { describe, expect, it } from "vitest";
import type { Relation } from "../contracts";
import {
  FIXTURE_PROFILES,
  FIXTURE_PROFILE_FRIEND,
  FIXTURE_PROFILE_SELF,
  FIXTURE_SHARED_POSTS,
} from "../fixtures-profiles";
import { canSeeGameData, profileVisibility, relationLabel, sharedSessionsOf } from "./profile-view";

const RELATIONS: Relation[] = ["self", "friends", "none", "outgoing_pending", "incoming_pending"];

describe("profileVisibility", () => {
  it("tells my profile, a friend's and a stranger's apart", () => {
    expect(profileVisibility("self")).toBe("self");
    expect(profileVisibility("friends")).toBe("friend");
    for (const r of ["none", "outgoing_pending", "incoming_pending"] as const) {
      expect(profileVisibility(r), r).toBe("limited");
    }
  });

  it("shows game data to me and to friends only, a pending request is not a friend", () => {
    expect(RELATIONS.filter(canSeeGameData).sort()).toEqual(["friends", "self"]);
  });
});

describe("relationLabel", () => {
  it("has a French label for every relation", () => {
    for (const r of RELATIONS) expect(relationLabel(r), r).toMatch(/\S/);
    expect(relationLabel("friends")).toBe("Ami");
    expect(relationLabel("self")).toBe("C'est toi");
  });
});

describe("sharedSessionsOf", () => {
  const charlesId = FIXTURE_PROFILE_FRIEND.id;

  it("keeps only that user's sessions, newest first", () => {
    const sessions = sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId);
    expect(sessions.length).toBeGreaterThan(1);
    const times = sessions.map((s) => Date.parse(s.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    const own = new Set(FIXTURE_SHARED_POSTS.filter((p) => p.author.id === charlesId).map((p) => p.id));
    expect(sessions.every((s) => own.has(s.id))).toBe(true);
  });

  it("never carries a subject, even when the post shares one", () => {
    expect(FIXTURE_SHARED_POSTS.some((p) => p.author.id === charlesId && p.subjectName)).toBe(true);
    for (const s of sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId)) {
      expect(Object.keys(s).sort()).toEqual(["createdAt", "durationMinutes", "earnedXp", "id", "streakDays"]);
    }
    const text = JSON.stringify(sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId));
    for (const subject of ["Droit du travail", "Finance", "Statistiques"])
      expect(text).not.toContain(subject);
  });

  it("respects the limit and an empty list", () => {
    expect(sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId, 2)).toHaveLength(2);
    expect(sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId, 0)).toEqual([]);
    expect(sharedSessionsOf(FIXTURE_SHARED_POSTS, "00000000-0000-4000-8000-0000000000ff")).toEqual([]);
    expect(sharedSessionsOf([], charlesId)).toEqual([]);
  });

  it("does not mutate its input", () => {
    const copy = [...FIXTURE_SHARED_POSTS];
    sharedSessionsOf(FIXTURE_SHARED_POSTS, charlesId);
    expect(FIXTURE_SHARED_POSTS).toEqual(copy);
  });
});

describe("fixtures", () => {
  it("cover every visibility", () => {
    expect(new Set(FIXTURE_PROFILES.map((p) => profileVisibility(p.relation)))).toEqual(
      new Set(["self", "friend", "limited"]),
    );
    expect(FIXTURE_PROFILE_SELF.relation).toBe("self");
  });

  it("have unique ids", () => {
    const ids = FIXTURE_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never carry a grade, an average, an e-mail or a goal in a profile", () => {
    const keys = new Set(FIXTURE_PROFILES.flatMap((p) => Object.keys(p)));
    for (const forbidden of [
      "email",
      "grades",
      "average",
      "moyenne",
      "subjects",
      "goal",
      "dailyGoalMinutes",
    ]) {
      expect(keys.has(forbidden), forbidden).toBe(false);
    }
  });
});
