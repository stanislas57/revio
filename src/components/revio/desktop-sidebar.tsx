"use client";

// Inspiration : shadcn/ui — Sidebar (MIT) · implémentation originale pour Revio
import type { ReactNode } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "./mobile-dock";
import { XpBar } from "./xp-bar";

/** Vertical menu on ink with the "Réviser maintenant" button and the profile card (XP bar). From 768 px up. */
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
    <aside className={cn("flex w-60 flex-col gap-5 rounded-xl bg-revio-ink p-4 text-white", className)}>
      <Link
        href={homeHref}
        className="flex min-h-11 items-center gap-3 rounded-md px-2 outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
      >
        <span
          aria-hidden
          className="bg-revio-gradient-solid flex size-9 items-center justify-center rounded-full font-heading font-bold"
        >
          R
        </span>
        <span className="font-heading text-xl font-bold">Revio</span>
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
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-white/60",
                    active
                      ? "bg-revio-ink-3 font-semibold text-white"
                      : "text-revio-muted-on-ink hover:bg-revio-ink-2 hover:text-white",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="rounded-pill bg-revio-magenta-solid px-2 py-0.5 text-xs font-bold text-white">
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
        className="bg-revio-gradient-solid flex min-h-12 items-center justify-center gap-2 rounded-pill px-4 font-semibold text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
      >
        <Zap className="size-4" aria-hidden /> Réviser maintenant
      </Link>
      <div className="mt-auto space-y-3 rounded-lg bg-revio-ink-2 p-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-revio-lilac text-sm font-bold text-revio-ink"
          >
            {profile.initials}
          </span>
          <p className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{profile.name}</span>
            <span className="block truncate text-xs text-revio-muted-on-ink">{profile.subtitle}</span>
          </p>
        </div>
        <XpBar tone="ink" level={profile.level} xp={profile.xp} xpMax={profile.xpMax} />
      </div>
      {footer}
    </aside>
  );
}
