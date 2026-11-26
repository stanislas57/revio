import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/modules/academic/components/dashboard-summary";
import { ExamsCard } from "@/modules/academic/components/exams-card";
import { Simulator } from "@/modules/academic/components/simulator";
import { ScenarioSimulator } from "@/modules/academic/components/scenario-simulator";
import { SubjectCard } from "@/modules/academic/components/subject-card";
import { SubjectForm } from "@/modules/academic/components/subject-form";
import { TargetForm } from "@/modules/academic/components/target-form";
import { TemplateImport } from "@/modules/academic/components/template-import";
import { TimePlanner } from "@/modules/academic/components/time-planner";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { FirstRunCard } from "@/modules/profile/components/first-run-card";
import { loadMyEducation } from "@/modules/profile/server/school";
import { requireUser } from "@/lib/auth";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { deleteScenario, saveScenario } from "@/modules/academic/server/scenario-actions";
import { listScenarios } from "@/modules/academic/server/scenarios";

export const metadata: Metadata = { title: "Accueil" };

export default async function AccueilPage() {
  const { supabase, user } = await requireUser();
  const [snapshot, scenarios, education] = await Promise.all([
    getAcademicSnapshot(),
    listScenarios(),
    loadMyEducation(supabase, user.id),
  ]);
  const dashboard = buildDashboard(snapshot);
  const names = new Map(snapshot.subjects.map((s) => [s.id, s.name]));
  const archived = snapshot.subjects.filter((s) => s.archived);

  return (
    <>
      <PageHeader
        title="Accueil"
        description="Ton tableau de bord : moyennes, objectifs et matières prioritaires."
      />
      <div className="space-y-6">
        {!education.onboardingDone && <FirstRunCard />}
        <DashboardSummary dashboard={dashboard} subjectNames={names} />
        <TargetForm target={snapshot.targetAverage} />

        <section aria-labelledby="matieres" className="space-y-4">
          <h2 id="matieres" className="text-lg font-semibold">
            Matières et notes
          </h2>
          {dashboard.activeSubjects.length === 0 ? (
            <>
              <EmptyState
                icon={GraduationCap}
                title="Aucune matière pour l'instant"
                description="Ajoute ta première matière ci-dessous, ou pars d'un exemple. Tes notes restent privées."
              >
                <Button asChild className="min-h-11">
                  <Link href="#ajouter-matiere">Ajouter ma première matière</Link>
                </Button>
              </EmptyState>
              {snapshot.subjects.length === 0 && <TemplateImport />}
            </>
          ) : (
            dashboard.activeSubjects.map((s) => <SubjectCard key={s.id} subject={s} />)
          )}
          <Card id="ajouter-matiere" className="scroll-mt-20">
            <CardHeader>
              <CardTitle>Ajouter une matière</CardTitle>
              <CardDescription>Le coefficient sert à pondérer ta moyenne générale.</CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectForm />
            </CardContent>
          </Card>
          {archived.length > 0 && (
            <details className="space-y-3">
              <summary className="cursor-pointer text-sm font-medium">
                Matières archivées ({archived.length})
              </summary>
              <div className="mt-3 space-y-3">
                {archived.map((s) => (
                  <SubjectCard key={s.id} subject={s} />
                ))}
              </div>
            </details>
          )}
        </section>

        <ExamsCard exams={dashboard.upcomingExams} subjects={dashboard.activeSubjects} />
        {dashboard.activeSubjects.length > 0 && (
          <>
            <Simulator subjects={dashboard.activeSubjects} defaultTarget={snapshot.targetAverage} />
            <ScenarioSimulator
              subjects={dashboard.activeSubjects}
              saved={scenarios}
              onSave={saveScenario}
              onDelete={deleteScenario}
            />
            <TimePlanner subjects={dashboard.activeSubjects} priorities={dashboard.priorities} />
          </>
        )}
      </div>
    </>
  );
}
