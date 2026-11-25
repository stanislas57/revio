import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { NotImplemented } from "@/components/states/not-implemented";

export const metadata: Metadata = { title: "Accueil" };

export default function AccueilPage() {
  return (
    <>
      <PageHeader
        title="Accueil"
        description="Ton tableau de bord : moyennes, objectifs et matières prioritaires."
      />
      <div className="space-y-4">
        <NotImplemented
          owner="Stan"
          feature="Tableau de bord académique : saisie des matières et des notes, moyenne pondérée, simulation et matières prioritaires."
        />
        <EmptyState
          icon={GraduationCap}
          title="Aucune note pour l'instant"
          description="Quand la saisie sera disponible, tes matières et ta moyenne apparaîtront ici. Tes notes restent privées."
        />
      </div>
    </>
  );
}
