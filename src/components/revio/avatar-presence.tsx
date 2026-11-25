"use client";

// Inspiration : Magic UI — Avatar Circles (MIT) · implémentation originale pour Revio
import { cn } from "@/lib/utils";
import { RevioRing } from "./revio-ring";

const TINTS = ["bg-revio-lilac", "bg-revio-border"];
const tintOf = (name: string) => TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length]!;

export type PresenceFriend = {
  id: string;
  name: string;
  initials: string;
  /** Subject being revised (only when the friend shares it). */
  subject?: string | null;
  minutes: number;
  /** Progress of the session ring, 0 to 1. */
  value: number;
};

/** A friend with the presence ring: the name, the subject and the duration are always written, never colour alone. */
export function AvatarPresence({
  friend,
  compact = false,
  fallbackSubject = "Matière non partagée",
}: {
  friend: PresenceFriend;
  compact?: boolean;
  /** Written when the friend does not share the subject. */
  fallbackSubject?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", compact && "flex-col gap-1.5 text-center")}>
      <RevioRing variant="presence" value={friend.value} size={compact ? 60 : 52} stroke={4} live>
        <span
          className={cn(
            "flex size-full items-center justify-center rounded-full text-sm font-bold text-revio-ink",
            tintOf(friend.name),
          )}
        >
          {friend.initials}
        </span>
      </RevioRing>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{friend.name}</p>
        {!compact && (
          <p className="truncate text-xs text-muted-foreground">
            {friend.subject ?? fallbackSubject} · {friend.minutes} min
          </p>
        )}
      </div>
    </div>
  );
}

/** The "En révision maintenant" row. */
export function PresenceRow({ friends, total }: { friends: PresenceFriend[]; total?: number }) {
  const count = total ?? friends.length;
  return (
    <section aria-labelledby="presence-title" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="presence-title" className="text-sm font-semibold">
          En révision maintenant
        </h2>
        <span className="text-xs font-semibold text-revio-magenta-text">
          {count} ami{count > 1 ? "s" : ""}
        </span>
      </div>
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun ami ne révise en ce moment.</p>
      ) : (
        <ul className="flex flex-wrap gap-x-4 gap-y-3">
          {friends.map((f) => (
            <li
              key={f.id}
              aria-label={`${f.name}, ${f.subject ?? "matière non partagée"}, ${f.minutes} minutes`}
            >
              <AvatarPresence friend={f} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
