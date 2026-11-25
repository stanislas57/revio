/** Focus contracts (see API_CONTRACTS.md, section 2). Types only. */

import type { IsoDate, IsoDateTime, Uuid } from "@/lib/contracts";
import type {
  Achievement,
  LevelProgress,
  StreakSummary,
  XpBreakdownItem,
} from "@/modules/gamification/contracts";

export type FocusMode = "free" | "countdown" | "pomodoro";
export type SessionVisibility = "private" | "friends";

/** Running or paused session. Display time is computed with `elapsedSeconds`, never counted. */
export type ActiveSession = {
  id: Uuid;
  mode: FocusMode;
  subject: { id: Uuid; name: string; color: string | null } | null;
  status: "running" | "paused";
  startedAt: IsoDateTime;
  /** Not null when status = "paused". */
  pausedAt: IsoDateTime | null;
  /** Total of finished pauses, in seconds. */
  pausedSeconds: number;
  plannedMinutes: number | null;
  visibility: SessionVisibility;
  /** Server clock when the data was read: offset = Date.parse(serverNow) - Date.now(). */
  serverNow: IsoDateTime;
};

export type StartSessionInput = {
  mode: FocusMode;
  subjectId?: Uuid;
  /** 1 to 600. Required for countdown and pomodoro. */
  plannedMinutes?: number;
  visibility?: SessionVisibility;
};

/** Official end-of-session summary, computed by the server. */
export type SessionResult = {
  sessionId: Uuid;
  subjectName: string | null;
  durationMinutes: number;
  countedMinutes: number;
  /** Shorter than the minimum: saved, 0 XP. */
  belowMinimum: boolean;
  earnedXp: number;
  xpBreakdown: XpBreakdownItem[];
  level: LevelProgress;
  leveledUp: boolean;
  streak: StreakSummary;
  dailyGoalCompleted: boolean;
  /** Always [] until achievements exist. */
  newAchievements: Achievement[];
  postCreated: boolean;
  /** true when finishSession had already been called for this session. */
  alreadyFinalized: boolean;
};

/** Study statistics over the last 30 days, from `my_study_stats()` (S-20). */
export type StudyStats = {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  bySubject: { subjectId: Uuid | null; name: string; color: string | null; minutes: number }[];
  daily: { date: IsoDate; minutes: number; xp: number }[];
};
