import { Clock, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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

/**
 * One completed session in the feed. Never shows a grade. A streak milestone is a Deep Violet card (the design's
 * "série" card) that invites a bravo; the others are white cards with a lavender edge. The XP is a lime pill
 * (rewards only), the duration and the streak are always written.
 */
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
    <article
      className={cn("space-y-3 rounded-3xl p-4", milestone ? "bg-revio-deep text-white" : "border bg-card")}
    >
      <header className="flex flex-col items-center gap-2 text-center">
        <UserAvatar user={post.author} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-bold">{name}</span> {post.isMine ? "as terminé" : "a terminé"}{" "}
            {formatMinutes(post.durationMinutes)}
            {post.subjectName && (
              <>
                {" "}
                de <span className="font-bold">{post.subjectName}</span>
              </>
            )}
            {post.streakDays > 1 && <> · série de {post.streakDays} jours</>}
            {" !"}
          </p>
          <time
            dateTime={post.createdAt}
            className={cn(
              "text-xs first-letter:uppercase",
              milestone ? "text-white/85" : "text-muted-foreground",
            )}
          >
            {whenFmt.format(new Date(post.createdAt))}
          </time>
        </div>
      </header>

      <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-pill px-3 py-1",
            milestone ? "bg-white/15" : "bg-brand-soft text-brand-soft-foreground",
          )}
        >
          <Clock className="size-3.5" aria-hidden /> {formatMinutes(post.durationMinutes)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-pill bg-revio-lime px-3 py-1 text-revio-midnight">
          <Sparkles className="size-3.5" aria-hidden /> +{post.earnedXp} XP
        </span>
        {post.streakDays > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-pill px-3 py-1",
              milestone ? "bg-revio-streak text-revio-midnight" : "bg-brand-soft text-brand-soft-foreground",
            )}
          >
            <Flame className="size-3.5" aria-hidden /> {post.streakDays} j{milestone ? " · palier !" : ""}
          </span>
        )}
      </div>

      {!post.isMine && (
        <footer className={cn("flex justify-center border-t pt-2", milestone && "border-white/20")}>
          <ReactionButton
            postId={post.id}
            count={post.reactionsCount}
            reacted={post.hasReacted}
            onToggle={onToggle}
            onDark={milestone}
          />
        </footer>
      )}
      {post.isMine && post.reactionsCount > 0 && (
        <p className={cn("border-t pt-2 text-sm", milestone ? "border-white/20" : "text-muted-foreground")}>
          {post.reactionsCount} bravo{post.reactionsCount > 1 ? "s" : ""} reçu
          {post.reactionsCount > 1 ? "s" : ""}
        </p>
      )}
    </article>
  );
}
