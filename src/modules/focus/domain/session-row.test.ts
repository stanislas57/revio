import { describe, expect, it } from "vitest";
import { toActiveSession } from "./session-row";

const row = {
  id: "s1",
  mode: "free",
  subject_id: "sub1",
  status: "in_progress",
  started_at: "2026-11-25T16:45:00+00:00",
  paused_at: null,
  paused_seconds: 0,
  planned_minutes: null,
  visibility: "friends",
};
const now = "2026-11-25T17:30:00.000Z";

describe("toActiveSession", () => {
  it("maps a running session with its subject", () => {
    const s = toActiveSession(row, { id: "sub1", name: "Stats", color: null }, now);
    expect(s).toMatchObject({
      status: "running",
      startedAt: "2026-11-25T16:45:00.000Z",
      subject: { name: "Stats" },
      serverNow: now,
    });
  });

  it("marks a paused session", () => {
    expect(toActiveSession({ ...row, paused_at: "2026-11-25T17:00:00Z" }, null, now)?.status).toBe("paused");
  });

  it("returns null for a finished session and drops a mismatched subject", () => {
    expect(toActiveSession({ ...row, status: "completed" }, null, now)).toBeNull();
    expect(toActiveSession(row, { id: "other", name: "x", color: null }, now)?.subject).toBeNull();
  });
});
