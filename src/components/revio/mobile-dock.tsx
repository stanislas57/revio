"use client";

// Inspiration : Animate UI — Motion Highlight / Tabs (MIT) · implémentation originale pour Revio
import Link from "next/link";
import { Zap, type LucideIcon } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; Icon: LucideIcon; badge?: number };

/**
 * Floating dock on ink: four tabs and, in the middle, the raised gradient "Réviser" button. The active tab is a
 * pill that slides. Shown under 768 px (the caller decides where it sits: `fixed` in the app shell).
 */
export function MobileDock({
  items,
  activeHref,
  reviseHref,
  className,
}: {
  /** Exactly four items: two on each side of the central button. */
  items: [NavItem, NavItem, NavItem, NavItem];
  activeHref: string;
  reviseHref: string;
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
          className="relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-pill px-2 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
          {active && (
            <motion.span
              layoutId="dock-pill"
              aria-hidden
              className="absolute inset-0 rounded-pill bg-revio-ink-3"
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
            />
          )}
          <item.Icon className="relative size-5" aria-hidden />
          <span className={cn("relative", active ? "font-semibold text-white" : "text-revio-muted-on-ink")}>
            {item.label}
          </span>
        </Link>
      </li>
    );
  };
  return (
    <nav
      aria-label="Navigation principale"
      className={cn("rounded-pill bg-revio-ink px-2 py-1.5 text-white shadow-xl", className)}
    >
      <LayoutGroup>
        <ul className="flex items-center">
          {tab(items[0])}
          {tab(items[1])}
          <li className="flex flex-1 justify-center">
            <Link
              href={reviseHref}
              className="bg-revio-gradient-solid -mt-7 flex size-14 flex-col items-center justify-center rounded-full border-4 border-background text-white shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60"
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
