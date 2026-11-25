import { Check } from "lucide-react";
import { DEMO_FRIENDS_LIVE, DEMO_LEVEL } from "../demo-data";

/** Small animated mock-ups of the four pillars (invented numbers, labelled as examples by the caller). */

const SUBJECTS = [
  { name: "Statistiques", grade: 15, coef: 3 },
  { name: "Droit", grade: 11, coef: 2 },
  { name: "Marketing", grade: 13.5, coef: 3 },
  { name: "Anglais", grade: 16, coef: 1 },
];

export function GradesMockup() {
  return (
    <div className="space-y-4">
      <div className="flex h-36 items-end gap-3" role="img" aria-label="Exemple : notes sur 20 par matière.">
        {SUBJECTS.map((s, i) => (
          <div key={s.name} className="flex h-full flex-1 flex-col items-center justify-end">
            <div
              className="mock-bar w-full rounded-t-md bg-brand"
              style={{ height: `${(s.grade / 20) * 100}%`, "--i": i } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
      <ul className="grid grid-cols-4 gap-3 text-center text-xs text-muted-foreground">
        {SUBJECTS.map((s) => (
          <li key={s.name}>
            <span className="block font-medium text-foreground">{s.name}</span>
            {s.grade.toString().replace(".", ",")} · coef {s.coef}
          </li>
        ))}
      </ul>
    </div>
  );
}

const WEEK = [
  { day: "Lun", slot: "18 h · Statistiques", min: 45 },
  { day: "Mer", slot: "17 h 30 · Droit", min: 60 },
  { day: "Ven", slot: "14 h · Marketing", min: 30 },
];

export function PlanningMockup() {
  return (
    <ul className="space-y-2">
      {WEEK.map((w, i) => (
        <li
          key={w.day}
          className="mock-slide flex items-center gap-3 rounded-lg border bg-card p-3 text-sm"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span className="w-10 font-semibold">{w.day}</span>
          <span className="flex-1">{w.slot}</span>
          <span className="text-muted-foreground">{w.min} min</span>
          <Check className="size-4 text-brand-text" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

export function FriendsMockup() {
  return (
    <ul className="space-y-2">
      {DEMO_FRIENDS_LIVE.slice(0, 3).map((f, i) => (
        <li
          key={f.name}
          className="mock-slide flex items-center gap-3 rounded-lg border bg-card p-3 text-sm"
          style={{ "--i": i } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground"
          >
            {f.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="flex-1 font-medium">{f.name}</span>
          <span className="flex items-center gap-2 text-muted-foreground tabular-nums">
            <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
            {f.minutes} min
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MotivationMockup() {
  const percent = Math.floor(DEMO_LEVEL.progress * 100);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="flex justify-between text-sm">
          <span className="font-medium">{DEMO_LEVEL.current.name}</span>
          <span className="text-muted-foreground">{DEMO_LEVEL.next?.name}</span>
        </p>
        <div
          role="progressbar"
          aria-label="Exemple : progression vers le niveau suivant"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div className="mock-fill h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm">
        {["15 jours de série", "Trophée Régulier", "+115 XP aujourd'hui"].map((t, i) => (
          <li
            key={t}
            className="mock-slide rounded-full border bg-card px-3 py-1"
            style={{ "--i": i } as React.CSSProperties}
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
