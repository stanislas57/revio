import { cn } from "@/lib/utils";

/**
 * The "revio." wordmark of the charter: lowercase Inter 900, tight, the dot in Revio Purple (lime on the dark
 * theme, as on the charter's dark mock-up). Text, not an image: it scales with `className` (text-*) and reads
 * "revio" to screen readers.
 */
export function RevioLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block font-heading leading-none font-black tracking-[-0.05em]", className)}>
      revio
      <span aria-hidden className="text-revio-primary dark:text-revio-lime">
        .
      </span>
    </span>
  );
}
