import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Inspiration : Magic UI — Neon Gradient Card (MIT) · implémentation originale en CSS pour Revio, sans code copié

type OrganicCardProps<T extends ElementType> = {
  as?: T;
  /** A soft gradient halo (violet, pink, lime) that pulses slowly behind the card. */
  halo?: boolean;
  /** `primary`: a Revio Purple card with white text (level, highlights). */
  tone?: "default" | "primary";
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * A "blob" card: generous, irregular corners that slowly change shape, and an optional pulsing halo. Only the
 * shape and the colours breathe; the content never moves. Pure CSS (globals.css, `.organic-card`), stopped by
 * `prefers-reduced-motion` and by the "Réduire les animations" setting. Text is centred.
 */
export function OrganicCard<T extends ElementType = "div">({
  as,
  halo = false,
  tone = "default",
  className,
  children,
  ...props
}: OrganicCardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "organic-card flex flex-col items-center gap-3 p-6 text-center",
        tone === "primary" ? "text-white" : "text-card-foreground",
        className,
      )}
      {...props}
    >
      {halo && <span aria-hidden className="organic-halo" />}
      <span
        aria-hidden
        className={cn(
          "organic-surface shadow-md",
          tone === "primary" ? "bg-revio-primary" : "border bg-card",
        )}
      />
      {children}
    </Tag>
  );
}
