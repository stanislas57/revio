"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMinutes } from "../../domain/format";
import type { StudyStats } from "../../contracts";
import { longDay, plainDay, shortDay, weekBins } from "../../domain/stats-view";
import { ChartFigure, DataTable } from "./chart-figure";
import { useReducedMotion } from "./use-reduced-motion";

const HEIGHT = 220;
const AXIS = { fill: "var(--muted-foreground)", fontSize: 12 } as const;
const TOOLTIP = {
  contentStyle: {
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
  },
  cursor: { fill: "var(--muted)", opacity: 0.5 },
} as const;
const nf = new Intl.NumberFormat("fr-FR");

function Frame({ children }: { children: React.ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height={HEIGHT} initialDimension={{ width: 320, height: HEIGHT }}>
      {children}
    </ResponsiveContainer>
  );
}

/** Minutes per day (the server's daily series, as it is). */
export function DailyMinutesChart({ daily }: { daily: StudyStats["daily"] }) {
  const reduced = useReducedMotion();
  const data = daily.map((d) => ({ ...d, label: shortDay(d.date) }));
  return (
    <ChartFigure
      title="Temps par jour"
      description={`Minutes de révision chaque jour, du ${plainDay(daily[0]!.date)} au ${plainDay(daily.at(-1)!.date)}.`}
      alt={`Graphique en barres : minutes de révision par jour, du ${plainDay(daily[0]!.date)} au ${plainDay(daily.at(-1)!.date)}. Les valeurs sont dans le tableau.`}
      table={
        <DataTable
          caption="Minutes de révision par jour"
          headers={["Jour", "Minutes"]}
          rows={daily.map((d) => [longDay(d.date), d.minutes])}
        />
      }
    >
      <Frame>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            {...TOOLTIP}
            formatter={(v) => [formatMinutes(Number(v)), "Révision"]}
            labelFormatter={(l) => String(l)}
          />
          <Bar dataKey="minutes" fill="var(--brand)" radius={[4, 4, 0, 0]} isAnimationActive={!reduced} />
        </BarChart>
      </Frame>
    </ChartFigure>
  );
}

/** Minutes per week: the daily series regrouped for display. Incomplete weeks are labelled as such. */
export function WeeklyMinutesChart({ daily }: { daily: StudyStats["daily"] }) {
  const reduced = useReducedMotion();
  const bins = weekBins(daily);
  const data = bins.map((b) => ({ ...b, label: `${shortDay(b.weekStart)}${b.partial ? " *" : ""}` }));
  return (
    <ChartFigure
      title="Temps par semaine"
      description="Minutes par semaine, du lundi au dimanche : la date sous chaque barre est celle du lundi. Une étoile marque une semaine que la période ne couvre qu'en partie."
      alt="Graphique en barres : minutes de révision par semaine, du lundi au dimanche. La première et la dernière semaine sont incomplètes. Les valeurs sont dans le tableau."
      table={
        <DataTable
          caption="Minutes de révision par semaine"
          headers={["Semaine", "Jours couverts", "Minutes"]}
          rows={bins.map((b) => [`Semaine du ${longDay(b.weekStart)}`, `${b.days} sur 7`, b.minutes])}
        />
      }
    >
      <Frame>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={0} height={44} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} formatter={(v) => [formatMinutes(Number(v)), "Révision"]} />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]} isAnimationActive={!reduced}>
            {data.map((d) => (
              <Cell key={d.weekStart} fill="var(--brand)" fillOpacity={d.partial ? 0.55 : 1} />
            ))}
          </Bar>
        </BarChart>
      </Frame>
    </ChartFigure>
  );
}

/** Minutes per subject (the user's own subjects, private). The names and values are always written out below. */
export function SubjectMinutesChart({ bySubject }: { bySubject: StudyStats["bySubject"] }) {
  const reduced = useReducedMotion();
  return (
    <ChartFigure
      title="Temps par matière"
      description="Minutes de révision par matière. Ces chiffres ne sont visibles que par toi."
      alt={`Graphique en barres : minutes de révision pour ${bySubject.length} matière${bySubject.length > 1 ? "s" : ""}. Les noms et les valeurs sont dans la liste et dans le tableau.`}
      table={
        <DataTable
          caption="Minutes de révision par matière"
          headers={["Matière", "Minutes"]}
          rows={bySubject.map((s) => [s.name, s.minutes])}
        />
      }
    >
      <Frame>
        <BarChart
          data={bySubject}
          layout="vertical"
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          accessibilityLayer={false}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip {...TOOLTIP} formatter={(v) => [formatMinutes(Number(v)), "Révision"]} />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]} isAnimationActive={!reduced}>
            {bySubject.map((s) => (
              <Cell key={s.subjectId ?? s.name} fill={s.color ?? "var(--muted-foreground)"} />
            ))}
          </Bar>
        </BarChart>
      </Frame>
      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {bySubject.map((s) => (
          <li key={s.subjectId ?? s.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-sm"
              style={{ background: s.color ?? "var(--muted-foreground)" }}
            />
            <span className="min-w-0 flex-1 break-words">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">{formatMinutes(s.minutes)}</span>
          </li>
        ))}
      </ul>
    </ChartFigure>
  );
}

/** XP earned each day (the server's daily series, as it is). */
export function DailyXpChart({ daily }: { daily: StudyStats["daily"] }) {
  const reduced = useReducedMotion();
  const data = daily.map((d) => ({ ...d, label: shortDay(d.date) }));
  return (
    <ChartFigure
      title="Évolution des XP"
      description="XP gagnés chaque jour."
      alt={`Graphique en courbe : XP gagnés par jour, du ${plainDay(daily[0]!.date)} au ${plainDay(daily.at(-1)!.date)}. Les valeurs sont dans le tableau.`}
      table={
        <DataTable
          caption="XP gagnés par jour"
          headers={["Jour", "XP"]}
          rows={daily.map((d) => [longDay(d.date), nf.format(d.xp)])}
        />
      }
    >
      <Frame>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={18} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} formatter={(v) => [`${nf.format(Number(v))} XP`, "XP du jour"]} />
          <Line
            type="monotone"
            dataKey="xp"
            stroke="var(--brand)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={!reduced}
          />
        </LineChart>
      </Frame>
    </ChartFigure>
  );
}
