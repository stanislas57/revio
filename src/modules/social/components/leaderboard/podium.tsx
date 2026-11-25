import { Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/modules/gamification/contracts";
import { userLabel } from "../../domain/names";
import { rankLabel } from "../../domain/leaderboard";
import { UserAvatar } from "../user-avatar";

const nf = new Intl.NumberFormat("fr-FR");

/** Pedestal height by rank, so the podium reads at a glance. */
const PEDESTAL: Record<number, string> = { 1: "h-24", 2: "h-16", 3: "h-12" };
/** Visual order (second, first, third) while the DOM keeps reading order 1, 2, 3. */
const VISUAL_ORDER: Record<number, string> = { 1: "order-2", 2: "order-1", 3: "order-3" };

/** The three first. The list is in reading order; CSS puts the winner in the middle. */
export function Podium({ entries }: { entries: readonly LeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol aria-label="Podium" className="flex items-end justify-center gap-2 sm:gap-4">
      {entries.slice(0, 3).map((e) => (
        <li
          key={e.user.id}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:max-w-40",
            VISUAL_ORDER[e.rank],
          )}
        >
          {e.rank === 1 ? (
            <Crown className="size-5 text-brand-text" aria-hidden />
          ) : (
            <Medal className="size-5 text-muted-foreground" aria-hidden />
          )}
          <UserAvatar
            user={e.user}
            className={cn(
              "size-12",
              e.isMe && "rounded-full ring-2 ring-brand ring-offset-2 ring-offset-background",
            )}
          />
          <p className="w-full text-sm font-semibold break-words">
            {userLabel(e.user)}
            {e.isMe && <span className="block text-xs font-medium text-brand-text">Toi</span>}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">{nf.format(e.weeklyXp)} XP</p>
          <div
            className={cn(
              "flex w-full items-center justify-center rounded-t-lg text-lg font-bold",
              PEDESTAL[e.rank],
              e.rank === 1 ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand-soft-foreground",
            )}
          >
            <span className="sr-only">Place </span>
            {rankLabel(e.rank)}
          </div>
        </li>
      ))}
    </ol>
  );
}
