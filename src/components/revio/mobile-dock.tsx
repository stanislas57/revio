"use client";

// Inspiration : Animate UI — Motion Highlight / Tabs (MIT) · implémentation originale pour Revio
import Link from "next/link";
import { Zap, type LucideIcon } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** A sub-page shown under its entry in the desktop sidebar while the entry is the current one. */
export type NavChild = { href: string; label: string };

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: number;
  children?: NavChild[];
};

/**
 * Bottom bar of the charter (mobile): four tabs and, in the middle, the raised violet "Réviser" button. The
 * active tab is a soft-purple pill that slides. Shown under 768 px (the caller decides where it sits: `fixed`
 * at the bottom in the app shell).
 */
export function MobileDock({
  items,
  activeHref,
  reviseHref,
  reviseActive = false,
  className,
}: {
  /** Exactly four items: two on each side of the central button. */
  items: [NavItem, NavItem, NavItem, NavItem];
  activeHref: string;
  reviseHref: string;
  /** The revise button leads to the current page: marks it `aria-current`. */
  reviseActive?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const tab = (item: NavItem) => {
    const active = item.href === activeHref;
    return (
      <li key={item.href} className="flex-1">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-2 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {active && (
            <motion.span
              layoutId="dock-pill"
              aria-hidden
              className="absolute inset-0 rounded-md bg-brand-soft"
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
            />
          )}
          <item.Icon
            className={cn("relative size-5", active ? "text-brand-soft-foreground" : "text-muted-foreground")}
            aria-hidden
          />
          <span
            className={cn(
              "relative",
              active ? "font-semibold text-brand-soft-foreground" : "text-muted-foreground",
            )}
          >
            {item.label}
          </span>
        </Link>
      </li>
    );
  };
  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "border-t bg-card px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] text-card-foreground shadow-md",
        className,
      )}
    >
      <LayoutGroup>
        <ul className="flex items-center">
          {tab(items[0])}
          {tab(items[1])}
          <li className="flex flex-1 justify-center">
            <Link
              href={reviseHref}
              aria-current={reviseActive ? "page" : undefined}
              className="-mt-7 flex size-14 flex-col items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-md transition-colors duration-150 outline-none hover:bg-revio-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/60 motion-reduce:transition-none"
            >
              <Zap className="size-5" aria-hidden />
              <span className="text-[0.65rem] font-bold">Réviser</span>
            </Link>
          </li>
          {tab(items[2])}
          {tab(items[3])}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
