"use client";

import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import type { StudyStats } from "../../contracts";
import { formatMinutes } from "../../domain/format";
import { isEmptyStats } from "../../domain/stats-view";
import { DailyMinutesChart, DailyXpChart, SubjectMinutesChart, WeeklyMinutesChart } from "./charts";
import { RegularityHeatmap } from "./heatmap";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Study statistics. Every number is the one the server sends: nothing is recomputed here
 * (the weekly bars only regroup the daily series for display).
 */
export function StudyStatsView({ stats }: { stats: StudyStats }) {
  if (isEmptyStats(stats)) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Pas encore de statistiques"
        description="Termine ta première séance Focus : ton temps de révision, tes XP et ta régularité apparaîtront ici."
      />
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="sr-only">Chiffres clés</h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Aujourd'hui" value={formatMinutes(stats.todayMinutes)} />
        <Tile label="Cette semaine" value={formatMinutes(stats.weekMinutes)} />
        <Tile label="Ce mois-ci" value={formatMinutes(stats.monthMinutes)} />
        <Tile label="Au total" value={formatMinutes(stats.totalMinutes)} />
        <Tile label="Séances" value={String(stats.sessionsCount)} />
        <Tile label="Durée moyenne" value={formatMinutes(stats.averageSessionMinutes)} />
      </dl>

      <h2 className="sr-only">Graphiques</h2>
      <RegularityHeatmap daily={stats.daily} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyMinutesChart daily={stats.daily} />
        <WeeklyMinutesChart daily={stats.daily} />
        <DailyXpChart daily={stats.daily} />
        {stats.bySubject.length > 0 ? (
          <SubjectMinutesChart bySubject={stats.bySubject} />
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucune matière n&apos;est associée à tes séances pour l&apos;instant.
          </div>
        )}
      </div>
    </div>
  );
}
