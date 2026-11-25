"use client";

import { useEffect, useRef } from "react";

/**
 * Animated number (0 -> value). The final value is rendered by the server, so it
 * is correct without JS; with reduced motion no animation runs.
 */
export function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nf = new Intl.NumberFormat("fr-FR");
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / durationMs);
      el.textContent = nf.format(Math.round(value * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat("fr-FR").format(value)}
    </span>
  );
}
