import { StatCard } from "@/components/revio/stat-card";
import { formatMinutes } from "@/modules/focus/domain/format";

/** Stat tiles of the charter (own data, computed in SQL). */
export function StatTiles({ totalMinutes, sessions }: { totalMinutes: number; sessions: number }) {
  const tiles = [
    { label: "Temps révisé", value: formatMinutes(totalMinutes) },
    { label: "Séances terminées", value: String(sessions) },
    { label: "Durée moyenne", value: sessions ? formatMinutes(totalMinutes / sessions) : "—" },
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <StatCard key={t.label} label={t.label} value={t.value} />
      ))}
    </dl>
  );
}
