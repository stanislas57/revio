"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Soft appearance on scroll. Server-rendered content is visible; only what sits below the fold is hidden
 * once the page is interactive, then shown when it comes near the screen. Nothing is hidden when the user
 * prefers reduced motion, when IntersectionObserver is missing, or when the block is already on screen.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    node.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          node.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`landing-reveal ${className}`}>
      {children}
    </div>
  );
}
