import { cn } from "@/lib/utils";
import { initials } from "../domain/names";

/** Initials avatar (avatar upload is not built yet). `live` adds a pulsing "en révision" dot. */
export function UserAvatar({
  user,
  live = false,
  className,
}: {
  user: { displayName: string; username: string | null };
  live?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex size-10 shrink-0", className)}>
      <span
        aria-hidden
        className="flex size-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground"
      >
        {initials(user)}
      </span>
      {live && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-3.5 rounded-full border-2 border-background bg-emerald-500" />
        </span>
      )}
    </span>
  );
}
