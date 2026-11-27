import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { BackToNotes } from "@/modules/academic/components/back-to-notes";
import { ConventionNote } from "@/modules/academic/components/priorities";
import { TimePlanner } from "@/modules/academic/components/time-planner";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Répartir mon temps" };

export default async function TimePage() {
  await requireUser();
  const dashboard = buildDashboard(await getAcademicSnapshot());

  return (
    <div className="space-y-8">
      <div>
        <BackToNotes />
        <PageHeader
          title="Répartir mon temps"
          description="Où mettre tes heures de révision ? Une suggestion."
        />
      </div>
      {dashboard.activeSubjects.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Il faut au moins une matière"
          description="La répartition suit tes matières, tes notes et tes examens."
        >
          <Button asChild className="min-h-11">
            <Link href="/notes/importer#ajouter-matiere">Ajouter ma première matière</Link>
          </Button>
        </EmptyState>
      ) : (
        <TimePlanner subjects={dashboard.activeSubjects} priorities={dashboard.priorities} />
      )}
      <ConventionNote />
    </div>
  );
}
