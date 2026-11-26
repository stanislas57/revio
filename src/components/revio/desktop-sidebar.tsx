"use client";

// Inspiration : shadcn/ui — Sidebar (MIT) · implémentation originale pour Revio
import type { ReactNode } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevioLogo } from "./logo";
import type { NavItem } from "./mobile-dock";
import { XpBar } from "./xp-bar";

/**
 * White vertical menu of the charter: the "revio." logo, the entries (the active one on soft purple), the violet
 * "Réviser maintenant" button and the profile card (XP bar). From 768 px up.
 */
export function DesktopSidebar({
  items,
  activeHref,
  reviseHref,
  profile,
  homeHref = "/",
  reviseActive = false,
  footer,
  className,
}: {
  items: NavItem[];
  activeHref: string;
  reviseHref: string;
  profile: { name: string; subtitle: string; initials: string; level: number; xp: number; xpMax: number };
  /** Where the logo leads (the app home). */
  homeHref?: string;
  /** The revise button leads to the current page: marks it `aria-current`. */
  reviseActive?: boolean;
  /** Below the profile card: account actions (sign out, theme). */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn("flex w-60 flex-col gap-5 border-r bg-sidebar p-4 text-sidebar-foreground", className)}
    >
      <Link
        href={homeHref}
        className="flex min-h-11 items-center justify-center rounded-md px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <RevioLogo className="text-[1.75rem]" />
      </Link>
      <nav aria-label="Navigation principale">
        <ul className="space-y-1">
          {items.map(({ href, label, Icon, badge }) => {
            const active = href === activeHref;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                    active
                      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  <span>{label}</span>
                  {badge ? (
                    <span className="rounded-pill bg-revio-social px-2 py-0.5 text-xs font-bold text-revio-midnight">
                      {badge}
                      <span className="sr-only"> nouveau{badge > 1 ? "x" : ""}</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href={reviseHref}
        aria-current={reviseActive ? "page" : undefined}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_4px_0_var(--edge-primary)] transition-[transform,box-shadow,background-color] duration-100 outline-none hover:bg-revio-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-1 active:shadow-none motion-reduce:transition-none"
      >
        <Zap className="size-4" aria-hidden /> Réviser maintenant
      </Link>
      <div className="mt-auto space-y-3 rounded-2xl border bg-card p-3 text-center">
        <div className="flex flex-col items-center gap-2">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-soft-foreground"
          >
            {profile.initials}
          </span>
          <p className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{profile.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{profile.subtitle}</span>
          </p>
        </div>
        <XpBar level={profile.level} xp={profile.xp} xpMax={profile.xpMax} />
      </div>
      {footer}
    </aside>
  );
}
