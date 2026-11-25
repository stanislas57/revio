import { Clock, Flame, HandHeart, Sparkles } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { levelProgress } from "@/modules/gamification/domain/levels";

const nf = new Intl.NumberFormat("fr-FR");

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <figcaption className="flex items-center justify-between gap-2 text-sm font-medium">
        {title}
        <MockBadge />
      </figcaption>
      {children}
    </figure>
  );
}

/** Illustrative previews (static, invented data). Not a screenshot of real users. */
export function Preview() {
  const level = levelProgress(4280);
  const percent = Math.floor(level.progress * 100);

  return (
    <section id="apercu" aria-labelledby="apercu-title" className="scroll-mt-16 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="apercu-title" className="text-3xl font-bold tracking-tight">
            À quoi ça ressemble
          </h2>
          <p className="text-muted-foreground">
            Des exemples illustratifs avec des données inventées, pour montrer l&apos;idée.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Panel title="Fin de séance">
            <p className="text-4xl font-bold text-brand-text">+95 XP</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>45 min de révision : +45 XP</li>
              <li>Objectif du jour atteint : +50 XP</li>
            </ul>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> Durée
                </dt>
                <dd className="mt-1 font-semibold">45 min</dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Flame className="size-3.5 text-orange-500" aria-hidden /> Série
                </dt>
                <dd className="mt-1 font-semibold">15 jours</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Niveau">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-text" aria-hidden />
              <p className="font-semibold">
                Niveau {level.current.number} · {level.current.name}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              {nf.format(level.totalXp)}{" "}
              <span className="text-base font-medium text-muted-foreground">XP</span>
            </p>
            <div
              role="progressbar"
              aria-label={`Progression vers ${level.next?.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">
              Encore {nf.format(level.xpUntilNextLevel ?? 0)} XP pour atteindre {level.next?.name} ({percent}{" "}
              %).
            </p>
          </Panel>

          <Panel title="Fil d'activité">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground"
              >
                LE
              </span>
              <p className="text-sm leading-snug">
                <span className="font-semibold">Léa</span> a terminé 45 min de{" "}
                <span className="font-semibold">Statistiques</span> · série de 15 jours !
              </p>
            </div>
            <p className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
              <HandHeart className="size-4" aria-hidden /> 8 bravos
            </p>
            <p className="text-xs text-muted-foreground">
              Tes amis ne voient que les séances que tu choisis de partager. Jamais tes notes.
            </p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
