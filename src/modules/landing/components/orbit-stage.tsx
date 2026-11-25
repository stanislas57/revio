"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Flame,
  LayoutDashboard,
  Medal,
  Pause,
  Play,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DEMO_CARDS, type DemoCardId } from "../demo-data";

// The full-screen demo views are loaded the first time a card is opened.
const DemoDialog = dynamic(() => import("./demo-dialog"), { ssr: false });

const ICONS: Record<DemoCardId, LucideIcon> = {
  "progression-xp": Sparkles,
  serie: Flame,
  trophees: Medal,
  objectifs: Target,
  amis: Users,
  stats: LayoutDashboard,
};

/** Which orbit each card is on (1 = inner, 2 = outer) and where it starts, as a fraction of the orbit. */
const PLACEMENT: Record<DemoCardId, { ring: 1 | 2; frac: number }> = {
  "progression-xp": { ring: 1, frac: 0 },
  serie: { ring: 1, frac: 1 / 3 },
  objectifs: { ring: 1, frac: 2 / 3 },
  trophees: { ring: 2, frac: 0.08 },
  amis: { ring: 2, frac: 0.08 + 1 / 3 },
  stats: { ring: 2, frac: 0.08 + 2 / 3 },
};

const isCardId = (hash: string): hash is DemoCardId => DEMO_CARDS.some((c) => `#${c.id}` === hash);

/**
 * The hero: the text (server-rendered, passed as children) with the six demo cards around it. On large
 * screens with motion allowed the cards turn slowly on two orbits (CSS only), follow the pointer a little,
 * and stop on hover, on keyboard focus or with the pause button. Everywhere else they form a plain grid.
 * A card opens a full-screen demo view; the address carries a hash (#serie…) so Back closes it.
 */
export function OrbitStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pushed = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [openId, setOpenId] = useState<DemoCardId | null>(null);

  // Deep link and browser Back / Forward: the address decides which view is open.
  useEffect(() => {
    const sync = () =>
      setOpenId(isCardId(window.location.hash) ? (window.location.hash.slice(1) as DemoCardId) : null);
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  // When a view closes (Escape, Retour, browser Back) the focus goes back to the card that opened it.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (openId) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const id = requestAnimationFrame(() => trigger.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [openId]);

  const open = useCallback((id: DemoCardId) => {
    trigger.current = document.activeElement as HTMLElement | null; // the card, to give the focus back
    window.history.pushState(null, "", `#${id}`);
    pushed.current = true;
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back(); // the popstate listener clears the view
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setOpenId(null);
    }
  }, []);

  // Light parallax: the pointer position becomes two CSS variables (-1..1) read by the stylesheet.
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const stage = stageRef.current;
    if (!stage) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty("--px", String(((clientX - r.left) / r.width - 0.5) * 2));
      stage.style.setProperty("--py", String(((clientY - r.top) / r.height - 0.5) * 2));
    });
  }
  function onPointerLeave() {
    cancelAnimationFrame(frame.current);
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
  }

  return (
    <>
      <div
        ref={stageRef}
        className="orbit-stage"
        data-paused={paused}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}

        <ul className="orbit-list" aria-label="Aperçus de démonstration">
          {DEMO_CARDS.map((card) => {
            const Icon = ICONS[card.id];
            const { ring, frac } = PLACEMENT[card.id];
            return (
              <li
                key={card.id}
                className="orbit-slot"
                data-ring={ring}
                style={{ "--frac": frac } as CSSProperties}
              >
                <div className="orbit-parallax">
                  <div className="orbit-x">
                    <div className="orbit-y">
                      <button
                        type="button"
                        className="orbit-card"
                        aria-haspopup="dialog"
                        onClick={() => open(card.id)}
                      >
                        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Icon className="size-4 text-brand-text" aria-hidden />
                          {card.title}
                        </span>
                        <span className="text-base leading-tight font-semibold">{card.value}</span>
                        <span className="text-xs text-muted-foreground">{card.hint}</span>
                        <span className="sr-only">Ouvrir l&apos;aperçu de démonstration</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="orbit-pause min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          {paused ? "Relancer le mouvement" : "Mettre le mouvement en pause"}
        </button>
      </div>

      {openId && <DemoDialog id={openId} onClose={close} />}
    </>
  );
}
