import { cn } from "@/lib/utils";
import { initials } from "../domain/names";

/** Initials avatar (images not supported yet: avatar upload is not built). */
export function UserAvatar({
  profile,
  live = false,
  className,
}: {
  profile: { display_name?: string | null; username?: string | null };
  live?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex size-10 shrink-0", className)}>
      <span
        aria-hidden
        className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white"
      >
        {initials(profile)}
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
