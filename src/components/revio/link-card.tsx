import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Makes a block of information clickable: the whole block leads to `href` through one link laid over it
 * (a single tab stop, named by `label`). Only wrap blocks without a button or a field of their own.
 */
export function LinkCard({
  href,
  label,
  className,
  children,
}: {
  href: string;
  /** Accessible name of the link: where it leads, e.g. "Voir mes matières". */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("group/link relative rounded-xl transition-shadow hover:shadow-md", className)}>
      {children}
      <Link
        href={href}
        aria-label={label}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
      />
    </div>
  );
}
