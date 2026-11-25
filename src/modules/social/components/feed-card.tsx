import { Clock, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/modules/focus/domain/time";
import { displayName } from "../domain/names";
import type { FeedItem } from "../server/queries";
import { ReactionButton } from "./reaction-button";
import { UserAvatar } from "./user-avatar";

const STREAK_HIGHLIGHTS = new Set([3, 7, 14, 21, 30, 50, 100, 200, 365]);

const whenFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** One completed session in the feed (generated from the session itself). */
export function FeedCard({ item }: { item: FeedItem }) {
  const name = item.isMine ? "Toi" : displayName(item.profiles ?? {});
  const minutes = item.duration_minutes ?? 0;
  const streak = item.streak_days ?? 0;
  const milestone = STREAK_HIGHLIGHTS.has(streak);
  const subject = item.label ? (
    <>
      {" "}
      de <span className="font-semibold">{item.label}</span>
    </>
  ) : null;

  return (
    <article className="space-y-3 rounded-xl border p-4">
      <header className="flex items-start gap-3">
        <UserAvatar profile={item.profiles ?? {}} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{name}</span> {item.isMine ? "as terminé" : "a terminé"}{" "}
            {formatMinutes(minutes)}
            {subject}
            {streak > 1 && (
              <>
                {" "}
                et {item.isMine ? "prolonges ta" : "prolonge sa"} série à {streak} jours
              </>
            )}
            {" !"}
          </p>
          <time dateTime={item.ended_at} className="text-xs text-muted-foreground first-letter:uppercase">
            {whenFmt.format(new Date(item.ended_at))}
          </time>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          <Clock aria-hidden /> {formatMinutes(minutes)}
        </Badge>
        <Badge variant="secondary" className="text-violet-700 dark:text-violet-300">
          <Sparkles aria-hidden /> +{item.xp_awarded ?? 0} XP
        </Badge>
        {streak > 0 && (
          <Badge
            variant={milestone ? "default" : "secondary"}
            className={milestone ? "bg-orange-500 text-white" : ""}
          >
            <Flame aria-hidden /> {streak} j{milestone ? " · palier !" : ""}
          </Badge>
        )}
      </div>

      <footer className="border-t pt-2">
        <ReactionButton
          sessionId={item.id}
          count={item.reactionCount}
          reacted={item.reactedByMe}
          disabled={item.isMine}
        />
      </footer>
    </article>
  );
}
