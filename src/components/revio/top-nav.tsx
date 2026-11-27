"use client";

// Inspiration : Animate UI — Motion Highlight / Tabs (MIT) · implémentation originale pour Revio
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { RevioLogo } from "./logo";
import type { NavItem } from "./mobile-dock";

/**
 * Horizontal navigation of the "barre en haut" layout: the logo, every entry with its icon and its name, and the
 * account actions. The active entry sits on a soft-purple pill that slides between entries. Under 768 px the
 * entries form their own row that scrolls sideways (the active one is brought into view).
 */
export function TopNav({
  items,
  activeHref,
  homeHref,
  level,
  actions,
  className,
}: {
  items: NavItem[];
  activeHref: string;
  homeHref: string;
  /** Small chip with the level, next to the actions. */
  level?: { number: number; name: string };
  actions?: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLElement>('a[aria-current="page"]');
    // Only the strip moves: the page itself must not jump.
    if (!active || !scroller.current) return;
    const box = scroller.current;
    box.scrollLeft = active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2;
  }, [activeHref]);

  return (
    <header className={cn("border-b bg-card", className)}>
      <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-3 px-4 md:flex-nowrap md:px-6">
        <Link
          href={homeHref}
          className="-mx-1 flex min-h-14 items-center rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <RevioLogo className="text-2xl" />
        </Link>

        <div className="ml-auto flex items-center gap-1 md:order-last">
          {level ? (
            <span className="mr-1 rounded-pill bg-brand-soft px-3 py-1 text-xs font-bold text-brand-soft-foreground">
              Niv. {level.number}
              <span className="sr-only"> · {level.name}</span>
            </span>
          ) : null}
          {actions}
        </div>

        <nav
          aria-label="Navigation principale"
          className="order-last -mx-4 w-[calc(100%+2rem)] md:order-none md:mx-0 md:w-auto md:min-w-0 md:flex-1"
        >
          <LayoutGroup id="top-nav">
            <ul
              ref={scroller}
              className="flex snap-x gap-1 overflow-x-auto px-4 pb-2 md:justify-center md:px-1 md:pb-0"
            >
              {items.map(({ href, label, Icon }) => {
                const active = href === activeHref;
                return (
                  <li key={href} className="shrink-0 snap-start">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className="relative flex min-h-11 items-center gap-2 rounded-pill px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:px-4"
                    >
                      {active && (
                        <motion.span
                          layoutId="top-nav-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-pill bg-brand-soft"
                          transition={
                            reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }
                          }
                        />
                      )}
                      <Icon
                        className={cn(
                          "relative size-5",
                          active ? "text-brand-soft-foreground" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "relative whitespace-nowrap",
                          active ? "font-semibold text-brand-soft-foreground" : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>
        </nav>
      </div>
    </header>
  );
}
