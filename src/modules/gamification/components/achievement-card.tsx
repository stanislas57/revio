import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "../contracts";
import {
  CATEGORY_LABEL,
  achievementState,
  isRecentlyUnlocked,
  progressPercent,
  stateLabel,
} from "../domain/achievements";
import { AchievementIcon } from "./achievement-icon";
import { ProgressBar } from "./progress-bar";

/** The status is told by an icon AND a word, never by color alone. */
export function AchievementCard({
  achievement,
  now,
  onOpen,
}: {
  achievement: Achievement;
  now: string;
  onOpen: (achievement: Achievement) => void;
}) {
  const state = achievementState(achievement);
  const percent = progressPercent(achievement);
  const fresh = isRecentlyUnlocked(achievement, now);

  return (
    <button
      type="button"
      onClick={() => onOpen(achievement)}
      aria-haspopup="dialog"
      className={cn(
        "flex min-h-11 w-full flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors outline-none",
        "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        state === "unlocked" && "border-brand/50 bg-brand-soft",
      )}
    >
      <span className="flex flex-col items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            state === "unlocked" ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {state === "locked" ? (
            <Lock className="size-5" />
          ) : (
            <AchievementIcon achievement={achievement} className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-words">{achievement.name}</span>
          <span
            className={cn(
              "block text-sm",
              state === "unlocked" ? "text-brand-soft-foreground" : "text-muted-foreground",
            )}
          >
            {CATEGORY_LABEL[achievement.category]}
          </span>
        </span>
        {fresh && (
          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-brand-foreground">
            Nouveau
          </span>
        )}
      </span>

      <span className="block text-sm break-words">{achievement.description}</span>

      <span className="mt-auto block space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {state === "unlocked" && <Check className="size-4 text-brand-text" aria-hidden />}
          {stateLabel(state)}
          {state === "in_progress" && achievement.progress && (
            <span className="font-normal text-muted-foreground tabular-nums">
              · {achievement.progress.current} / {achievement.progress.target}
            </span>
          )}
        </span>
        {state === "in_progress" && percent !== null && (
          <ProgressBar value={percent} label={`Progression de ${achievement.name}`} barClassName="bg-brand" />
        )}
      </span>
    </button>
  );
}
