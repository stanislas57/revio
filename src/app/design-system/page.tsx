import type { Metadata } from "next";
import { MockBadge } from "@/components/states/not-implemented";
import { DesignSystemDemo } from "./demo";

export const metadata: Metadata = {
  title: "Design system",
  description: "Les composants du design system Revio, avec des données d'exemple.",
  robots: { index: false, follow: false },
};

/** Public showcase of `components/revio/` (data from `lib/mock/revio-demo.ts`). Not linked from the app. */
export default function DesignSystemPage() {
  return (
    <main className="revio-grid min-h-dvh">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-3">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Design system Revio</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MockBadge /> Tous les composants de <code>components/revio/</code> dans leurs états principaux,
            avec des données inventées. Jetons et contrastes : <code>docs/design-system.md</code>.
          </p>
        </header>
        <DesignSystemDemo />
      </div>
    </main>
  );
}
