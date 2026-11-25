"use client";

// Inspiration : Magic UI — Shine Border (MIT) · implémentation originale pour Revio (carte inclinée avec Motion)
import { Lock, type LucideIcon } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type Rarity = "common" | "rare" | "epic";
const RARITY_LABEL: Record<Rarity, string> = { common: "Commun", rare: "Rare", epic: "Épique" };

/**
 * A badge in three rarities, always written as a word (never colour alone):
 * common has no effect; rare has a glowing violet border; epic is a Revio Purple card, slightly tilted, with a shine that
 * follows the pointer. With reduced motion the effects are static.
 */
export function BadgeCard({
  name,
  rarity,
  Icon,
  unlocked = true,
}: {
  name: string;
  rarity: Rarity;
  Icon: LucideIcon;
  unlocked?: boolean;
}) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 24 });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 24 });
  const epic = rarity === "epic";
  /** A locked epic badge looks like any locked badge (dashed, soft purple): the purple card is the reward. */
  const epicLook = epic && unlocked;
  const live = epicLook && !reduced;

  return (
    <motion.article
      aria-label={`Badge ${name}, ${RARITY_LABEL[rarity]}${unlocked ? "" : ", à débloquer"}`}
      className={cn(
        "relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center",
        rarity === "common" && "bg-card",
        rarity === "rare" &&
          "border-revio-primary bg-card shadow-[0_0_0_3px_color-mix(in_oklab,var(--revio-primary)_22%,transparent),0_10px_28px_-12px_var(--revio-primary)]",
        epicLook && "border-revio-primary bg-revio-primary text-white",
        !unlocked && "border-dashed bg-secondary",
      )}
      style={
        live
          ? { rotateX, rotateY, rotate: -2, transformPerspective: 600 }
          : epicLook
            ? { rotate: -2 }
            : undefined
      }
      onPointerMove={(e) => {
        if (!live) return;
        const box = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - box.left) / box.width - 0.5);
        py.set((e.clientY - box.top) / box.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      {epicLook && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/15 via-transparent to-white/5"
        />
      )}
      <span
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          epicLook ? "bg-white/20 text-white" : "bg-secondary text-brand-text",
        )}
      >
        {unlocked ? <Icon className="size-6" /> : <Lock className="size-6" />}
      </span>
      <span className="font-heading text-sm font-bold">{name}</span>
      <span
        className={cn(
          "text-xs font-semibold",
          epicLook ? "text-white" : rarity === "rare" ? "text-brand-text" : "text-muted-foreground",
        )}
      >
        {RARITY_LABEL[rarity]}
        {!unlocked && " · à débloquer"}
      </span>
    </motion.article>
  );
}
