// Source : canvas-confetti · Licence ISC · utilisé tel quel (dépendance), couleurs Revio

/** Violet, magenta and white: the celebration colours of the design system (lime is for XP only). */
const COLORS = ["#7b2ff7", "#e11d8f", "#ffffff"];

/**
 * Throws a burst of confetti once, from a point of the screen (0 to 1, default: centre). Does nothing when the
 * user prefers reduced motion. The library is loaded only when a celebration happens.
 */
export async function celebrate(options: { origin?: { x: number; y: number }; particleCount?: number } = {}) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: options.particleCount ?? 90,
    spread: 70,
    startVelocity: 38,
    ticks: 160,
    origin: options.origin ?? { x: 0.5, y: 0.6 },
    colors: COLORS,
    disableForReducedMotion: true,
    zIndex: 200,
  });
}
