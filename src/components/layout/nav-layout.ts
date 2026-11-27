import { z } from "zod";

/** Where the main navigation sits: the white sidebar on the left, or a horizontal bar at the top. */
export const NAV_LAYOUTS = ["sidebar", "top"] as const;
export type NavLayout = (typeof NAV_LAYOUTS)[number];

/** Used while the user has not chosen (and on the server when the saved value is unreadable). */
export const DEFAULT_NAV_LAYOUT: NavLayout = "sidebar";

/** Device copy of the choice (the database is the reference; this one makes the switch instant). */
export const NAV_LAYOUT_STORAGE_KEY = "revio-nav-layout";

export const navLayoutSchema = z.enum(NAV_LAYOUTS);

export function isNavLayout(value: unknown): value is NavLayout {
  return navLayoutSchema.safeParse(value).success;
}

export const NAV_LAYOUT_LABELS: Record<NavLayout, { title: string; hint: string }> = {
  sidebar: { title: "Barre latérale à gauche", hint: "Le menu reste à gauche, toujours visible." },
  top: { title: "Barre horizontale en haut", hint: "Le menu passe en haut, avec les icônes et les noms." },
};
