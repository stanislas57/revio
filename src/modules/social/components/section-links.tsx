import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";

export type SectionLink = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** The destination still shows sample data (shown next to the link, never hidden). */
  mock?: boolean;
};

/**
 * Links to the sub-pages of a tab. Each link is a block of at least 44 px whose accessible name is its
 * title followed by its description, so a screen reader announces where it leads.
 */
export function SectionLinks({ label, links }: { label: string; links: SectionLink[] }) {
  return (
    <nav aria-label={label}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map(({ href, title, description, icon: Icon, mock }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-2xl border bg-card px-3 py-2 transition-colors outline-none hover:bg-brand-soft/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Icon className="size-5 shrink-0 text-brand-text" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
                {mock && (
                  <span className="mt-1 block">
                    <MockBadge />
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
