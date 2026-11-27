import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Cours", className: "bg-brand-soft" },
  { label: "Révision", className: "bg-revio-midnight dark:bg-primary" },
  { label: "Contrôle", className: "bg-revio-primary" },
  { label: "Indisponible", className: "border border-dashed bg-muted" },
] as const;

/** What the colours of the timetable mean, always written (never a colour alone). */
export function Legend({ withNow = false }: { withNow?: boolean }) {
  return (
    <ul aria-label="Légende" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
      {ITEMS.map(({ label, className }) => (
        <li key={label} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-3.5 rounded-full border border-foreground/20", className)} />
          {label}
        </li>
      ))}
      {withNow && (
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-4 rounded-full bg-revio-social-text" />
          Maintenant
        </li>
      )}
    </ul>
  );
}
