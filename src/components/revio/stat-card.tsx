import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A figure and its label, as on the charter's dashboard ("12 jours · Streak actuel"): white card, Inter 800
 * figure, small readable label. Render inside a `<dl>` (it outputs a `<div>` with `<dt>` / `<dd>`).
 */
export function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Optional decorative icon, top right (already `aria-hidden` by the caller). */
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col-reverse gap-1 rounded-xl border bg-card p-4 shadow-sm", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-start justify-between gap-2 font-heading text-2xl font-extrabold tracking-[-0.02em] tabular-nums sm:text-[1.75rem]">
        <span className="min-w-0 break-words">{value}</span>
        {icon}
      </dd>
    </div>
  );
}
