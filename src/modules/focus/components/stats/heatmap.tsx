import { cn } from "@/lib/utils";
import type { StudyStats } from "../../contracts";
import {
  INTENSITY_THRESHOLDS,
  heatmapColumns,
  longDay,
  plainDay,
  type IntensityLevel,
} from "../../domain/stats-view";
import { ChartFigure, DataTable } from "./chart-figure";

const LEVEL_CLASS: Record<IntensityLevel, string> = {
  0: "bg-muted",
  1: "bg-brand/25",
  2: "bg-brand/50",
  3: "bg-brand/75",
  4: "bg-brand",
};
const LEVEL_TEXT = ["aucune révision", "moins de 15 min", "15 à 29 min", "30 à 59 min", "1 h ou plus"];
const ROW_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

/** Regularity calendar: one square per day, Monday on top, darker means more study time. */
export function RegularityHeatmap({ daily }: { daily: StudyStats["daily"] }) {
  const columns = heatmapColumns(daily);
  if (columns.length === 0) return null;
  const first = daily[0]!.date;
  const last = daily.at(-1)!.date;
  return (
    <ChartFigure
      title="Régularité"
      description="Une case par jour : plus elle est foncée, plus tu as révisé ce jour-là."
      alt={`Calendrier de régularité du ${plainDay(first)} au ${plainDay(last)} : une case par jour, de « aucune révision » à « 1 h ou plus ». Les valeurs jour par jour sont dans le tableau.`}
      table={
        <DataTable
          caption="Temps de révision par jour"
          headers={["Jour", "Minutes"]}
          rows={daily.map((d) => [longDay(d.date), d.minutes])}
        />
      }
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="grid grid-rows-7 gap-1.5 pt-0 text-xs text-muted-foreground" aria-hidden>
          {ROW_LABELS.map((l, i) => (
            <span key={i} className="flex h-7 items-center">
              {l}
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {columns.map((col, c) => (
            <div key={c} className="grid grid-rows-7 gap-1.5">
              {col.map((cell, r) => (
                <span
                  key={r}
                  title={cell.date ? `${longDay(cell.date)} : ${cell.minutes} min` : undefined}
                  data-level={cell.date ? cell.level : undefined}
                  className={cn("size-7 rounded-md", cell.date ? LEVEL_CLASS[cell.level] : "bg-transparent")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", LEVEL_CLASS[level])} />
            {LEVEL_TEXT[level]}
          </li>
        ))}
      </ul>
      <p className="sr-only">Échelle : {INTENSITY_THRESHOLDS.join(", ")} minutes.</p>
    </ChartFigure>
  );
}
