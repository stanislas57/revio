import { Clock, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/modules/focus/domain/format";
import { STREAK_MILESTONES } from "@/modules/gamification/domain/levels";
import type { FeedPost } from "../contracts";
import { userLabel } from "../domain/names";
import { ReactionButton } from "./reaction-button";
import { UserAvatar } from "./user-avatar";

const whenFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** One completed session in the feed. Never shows a grade. */
export function FeedCard({
  post,
  onToggle,
}: {
  post: FeedPost;
  onToggle?: React.ComponentProps<typeof ReactionButton>["onToggle"];
}) {
  const name = post.isMine ? "Toi" : userLabel(post.author);
  const milestone = STREAK_MILESTONES.includes(post.streakDays);

  return (
    <article className="space-y-3 rounded-xl border p-4">
      <header className="flex items-start gap-3">
        <UserAvatar user={post.author} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{name}</span> {post.isMine ? "as terminé" : "a terminé"}{" "}
            {formatMinutes(post.durationMinutes)}
            {post.subjectName && (
              <>
                {" "}
                de <span className="font-semibold">{post.subjectName}</span>
              </>
            )}
            {post.streakDays > 1 && <> · série de {post.streakDays} jours</>}
            {" !"}
          </p>
          <time dateTime={post.createdAt} className="text-xs text-muted-foreground first-letter:uppercase">
            {whenFmt.format(new Date(post.createdAt))}
          </time>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          <Clock aria-hidden /> {formatMinutes(post.durationMinutes)}
        </Badge>
        <Badge variant="secondary" className="text-brand-text">
          <Sparkles aria-hidden /> +{post.earnedXp} XP
        </Badge>
        {post.streakDays > 0 && (
          <Badge
            variant={milestone ? "default" : "secondary"}
            className={milestone ? "bg-orange-500 text-white" : ""}
          >
            <Flame aria-hidden /> {post.streakDays} j{milestone ? " · palier !" : ""}
          </Badge>
        )}
      </div>

      {!post.isMine && (
        <footer className="border-t pt-2">
          <ReactionButton
            postId={post.id}
            count={post.reactionsCount}
            reacted={post.hasReacted}
            onToggle={onToggle}
          />
        </footer>
      )}
      {post.isMine && post.reactionsCount > 0 && (
        <p className="border-t pt-2 text-sm text-muted-foreground">
          {post.reactionsCount} bravo{post.reactionsCount > 1 ? "s" : ""} reçu
          {post.reactionsCount > 1 ? "s" : ""}
        </p>
      )}
    </article>
  );
}
