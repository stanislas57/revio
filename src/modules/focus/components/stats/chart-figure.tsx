import type { ReactNode } from "react";

/**
 * A chart with its text alternative. The graphic is exposed as one image described by `alt`
 * (it is not keyboard-navigable), and the same numbers are always available in a table.
 */
export function ChartFigure({
  title,
  description,
  alt,
  table,
  children,
}: {
  title: string;
  description: string;
  alt: string;
  table: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="space-y-3 rounded-xl border p-4">
      <figcaption className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </figcaption>
      <div role="img" aria-label={alt}>
        {children}
      </div>
      <details className="group text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          Voir les données du graphique
        </summary>
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border">{table}</div>
      </details>
    </figure>
  );
}

/** Simple accessible table: a caption, scoped headers, right-aligned numbers. */
export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly (string | number)[])[];
}) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-muted">
        <tr>
          {headers.map((h, i) => (
            <th key={h} scope="col" className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="px-3 py-1.5 font-normal">
                  {cell}
                </th>
              ) : (
                <td key={i} className="px-3 py-1.5 text-right tabular-nums">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
