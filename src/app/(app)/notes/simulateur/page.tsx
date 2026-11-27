import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { BackToNotes } from "@/modules/academic/components/back-to-notes";
import { ConventionNote } from "@/modules/academic/components/priorities";
import { ScenarioSimulator } from "@/modules/academic/components/scenario-simulator";
import { Simulator } from "@/modules/academic/components/simulator";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { deleteScenario, saveScenario } from "@/modules/academic/server/scenario-actions";
import { listScenarios } from "@/modules/academic/server/scenarios";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Simulateur et scénarios" };

export default async function SimulatorPage() {
  await requireUser();
  const [snapshot, scenarios] = await Promise.all([getAcademicSnapshot(), listScenarios()]);
  const dashboard = buildDashboard(snapshot);

  return (
    <div className="space-y-8">
      <div>
        <BackToNotes />
        <PageHeader
          title="Simulateur"
          description="Et si j'avais… au prochain contrôle ? Rien n'est enregistré."
        />
      </div>
      {dashboard.activeSubjects.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Il faut au moins une matière"
          description="Le simulateur calcule avec tes matières et tes notes."
        >
          <Button asChild className="min-h-11">
            <Link href="/notes/importer#ajouter-matiere">Ajouter ma première matière</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <Simulator subjects={dashboard.activeSubjects} defaultTarget={snapshot.targetAverage} />
          <section id="scenarios" aria-label="Scénarios" className="scroll-mt-20">
            <ScenarioSimulator
              subjects={dashboard.activeSubjects}
              saved={scenarios}
              onSave={saveScenario}
              onDelete={deleteScenario}
            />
          </section>
        </>
      )}
      <ConventionNote />
    </div>
  );
}
