import { formatMinutes } from "@/modules/focus/domain/format";

/** Simple stat tiles (own data, computed in SQL). */
export function StatTiles({ totalMinutes, sessions }: { totalMinutes: number; sessions: number }) {
  const tiles = [
    { label: "Temps révisé", value: formatMinutes(totalMinutes) },
    { label: "Séances terminées", value: String(sessions) },
    { label: "Durée moyenne", value: sessions ? formatMinutes(totalMinutes / sessions) : "—" },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border p-3">
          <dt className="text-xs text-muted-foreground">{t.label}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{t.value}</dd>
        </div>
      ))}
    </dl>
  );
}
