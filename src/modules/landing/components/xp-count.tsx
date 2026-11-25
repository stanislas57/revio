"use client";

import { useEffect, useRef } from "react";

/**
 * "+115 XP" that counts up when it comes on screen. The final value is the server-rendered text: without
 * JavaScript, with reduced motion, or when already visible at load, nothing moves.
 */
export function XpCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    let raf = 0;
    node.textContent = "+0";
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / 1200);
        node.textContent = `+${Math.round(value * (1 - (1 - k) ** 3))}`;
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums" aria-label={`+${value}`}>
      +{value}
    </span>
  );
}
