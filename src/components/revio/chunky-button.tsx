import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Inspiration : Duolingo (boutons « 3D ») et Uiverse (MIT) · implémentation originale pour Revio, sans code copié

/**
 * The big Duolingo-like button: thick, rounded, a solid darker edge at the bottom that disappears when it is
 * pressed. A thin wrapper of `Button` (same variants, `xl` size by default), so links work with `asChild`.
 * `reward` is for rewards and XP only (Electric Lime).
 */
export function ChunkyButton({
  className,
  size = "xl",
  block = false,
  ...props
}: ComponentProps<typeof Button> & { /** Full width (mobile-first forms and steps). */ block?: boolean }) {
  return <Button size={size} className={cn(block && "w-full", className)} {...props} />;
}
