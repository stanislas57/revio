import type { ReactNode } from "react";
import { MockBadge, NotImplemented } from "@/components/states/not-implemented";

/**
 * Every preview screen starts with this banner: these screens show the Revio design with sample data, for
 * features that do not exist in the product yet. Nothing here reads or writes real data.
 */
export function PreviewBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 space-y-3">
      <NotImplemented feature={`Maquette du nouveau design avec des données inventées. ${children}`} />
      <p className="flex items-center gap-2 text-sm">
        <MockBadge /> Les boutons grisés ne font rien : la fonction n&apos;existe pas encore.
      </p>
    </div>
  );
}
