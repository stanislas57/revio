import { Clock, Flame, HandHeart, Sparkles } from "lucide-react";
import { MockBadge } from "@/components/states/not-implemented";
import { ProgressBar } from "@/modules/gamification/components/progress-bar";
import {
  DEMO_FEED,
  DEMO_LEVEL,
  DEMO_SESSION,
  DEMO_SESSION_XP,
  DEMO_STREAK_DAYS,
  DEMO_XP,
} from "../demo-data";
import { Reveal } from "./reveal";
import { XpCount } from "./xp-count";

const nf = new Intl.NumberFormat("fr-FR");

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-[0_18px_50px_-30px_rgb(20_20_20/0.3)]">
      <figcaption className="flex items-center justify-between gap-2 text-sm font-medium">
        {title}
        <MockBadge />
      </figcaption>
      {children}
    </figure>
  );
}

/** Illustrative previews (static, invented data from demo-data.ts). Not a screenshot of real users. */
export function Preview() {
  const percent = Math.floor(DEMO_LEVEL.progress * 100);

  return (
    <section id="apercu" aria-labelledby="apercu-title" className="scroll-mt-16 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 id="apercu-title" className="landing-serif text-4xl sm:text-5xl">
            À quoi ça <em className="text-brand-text">ressemble</em>
          </h2>
          <p className="text-muted-foreground">
            Des exemples illustratifs avec des données inventées, pour montrer l&apos;idée.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Panel title="Fin de séance">
            <p className="landing-serif text-6xl text-brand-text">
              <XpCount value={DEMO_SESSION_XP} /> <span className="text-2xl">XP</span>
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {DEMO_SESSION.breakdown.map((item) => (
                <li key={item.label}>
                  {item.label} : +{item.xp} XP
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> Durée
                </dt>
                <dd className="mt-1 font-semibold">1 h 05</dd>
              </div>
              <div className="rounded-lg border p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Flame className="size-3.5 text-orange-500" aria-hidden /> Série
                </dt>
                <dd className="mt-1 font-semibold">{DEMO_STREAK_DAYS} jours</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Niveau">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-text" aria-hidden />
              <p className="font-semibold">
                Niveau {DEMO_LEVEL.current.number} · {DEMO_LEVEL.current.name}
              </p>
            </div>
            <p className="landing-serif text-5xl">
              {nf.format(DEMO_XP)} <span className="text-xl text-muted-foreground">XP</span>
            </p>
            <ProgressBar
              value={percent}
              label={`Progression vers ${DEMO_LEVEL.next?.name}`}
              className="h-3"
              barClassName="bg-brand"
            />
            <p className="text-sm text-muted-foreground">
              Encore {nf.format(DEMO_LEVEL.xpUntilNextLevel ?? 0)} XP pour atteindre {DEMO_LEVEL.next?.name} (
              {percent} %).
            </p>
          </Panel>

          <Panel title="Fil d'activité">
            <ul className="space-y-4">
              {DEMO_FEED.map((post) => (
                <li key={post.name} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground"
                  >
                    {post.initials}
                  </span>
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{post.name}</span> {post.text}
                    {post.subject && <span className="font-semibold"> {post.subject}</span>}
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HandHeart className="size-3.5 text-brand-text" aria-hidden /> {post.kudos} bravos
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Tes amis ne voient que les séances que tu choisis de partager. Jamais tes notes.
            </p>
          </Panel>
        </div>
      </Reveal>
    </section>
  );
}
