import type { LevelProgress } from "../contracts";

const nf = new Intl.NumberFormat("fr-FR");

/**
 * Current level, total XP and progress to the next level: the charter's level card (Revio Purple, white text,
 * Electric Lime bar).
 */
export function LevelCard({ level }: { level: LevelProgress }) {
  const percent = Math.floor(level.progress * 100);
  return (
    <section
      aria-labelledby="level-card-title"
      className="flex flex-col justify-between gap-4 rounded-xl bg-revio-primary p-5 text-white shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="level-card-title" className="text-xl font-extrabold">
          Niveau {level.current.number} · {level.current.name}
        </h2>
        <p className="text-sm tabular-nums">{nf.format(level.totalXp)} XP</p>
      </div>
      <div
        role="progressbar"
        aria-label={level.next ? `Progression vers ${level.next.name}` : "Niveau maximum"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2.5 overflow-hidden rounded-pill bg-white/30"
      >
        <div className="h-full rounded-pill bg-revio-lime" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm">
        {level.next && level.xpUntilNextLevel !== null
          ? `Encore ${nf.format(level.xpUntilNextLevel)} XP pour atteindre ${level.next.name} (${percent} %).`
          : "Niveau maximum atteint."}
      </p>
    </section>
  );
}
