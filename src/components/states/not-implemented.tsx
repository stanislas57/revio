import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Marks a screen or block that is NOT functional yet.
 * Rule: any placeholder UI must be wrapped in or accompanied by this, so
 * nobody (users, demo audience, co-founders) mistakes it for a real feature.
 */
export function NotImplemented({ feature, owner }: { feature: string; owner?: "Stan" | "Charles" }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <Construction className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Pas encore disponible</span>
          <Badge variant="outline">Factice</Badge>
          {owner && <Badge variant="secondary">Responsable : {owner}</Badge>}
        </div>
        <p className="text-muted-foreground">{feature}</p>
      </div>
    </div>
  );
}

/** Small inline badge for a single fake value or block (e.g. sample numbers). */
export function MockBadge() {
  return (
    <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
      Données d&apos;exemple
    </Badge>
  );
}
