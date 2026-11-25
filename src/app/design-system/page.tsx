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
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-3">
          <h1 className="font-heading text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Design system Revio
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <MockBadge /> Tous les composants de <code>components/revio/</code> dans leurs états principaux,
            avec des données inventées, aux couleurs de la charte graphique bêta 01. Jetons et contrastes :{" "}
            <code>docs/design-system.md</code>.
          </p>
        </header>
        <DesignSystemDemo />
      </div>
    </main>
  );
}
