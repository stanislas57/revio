import { cn } from "@/lib/utils";

/** Accessible progress bar (module-local; swap for shadcn `progress` once added). */
export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: {
  value: number;
  label: string;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full origin-left rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none",
          barClassName,
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
