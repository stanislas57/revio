"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True when the visitor asked for reduced motion (false on the server and before hydration). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

const noop = () => () => {};

/**
 * Becomes true the first time the element comes into view, then stays true. Without IntersectionObserver
 * it is true at once (the final state is shown, nothing waits for an event that will never come).
 */
export function useInViewOnce(ref: RefObject<Element | null>, rootMargin = "0px 0px -15% 0px"): boolean {
  const [seen, setSeen] = useState(false);
  const unsupported = useSyncExternalStore(
    noop,
    () => typeof IntersectionObserver === "undefined",
    () => false,
  );
  useEffect(() => {
    const node = ref.current;
    if (!node || seen || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, seen]);
  return seen || unsupported;
}
