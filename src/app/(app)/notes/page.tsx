import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { ExamsCard } from "@/modules/academic/components/exams-card";
import { NotesHero } from "@/modules/academic/components/notes-hero";
import { ConventionNote, Priorities } from "@/modules/academic/components/priorities";
import { SubjectCard } from "@/modules/academic/components/subject-card";
import { TargetForm } from "@/modules/academic/components/target-form";
import { TemplateImport } from "@/modules/academic/components/template-import";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { listScenarios } from "@/modules/academic/server/scenarios";
import { STUDY_LEVEL_LABELS } from "@/modules/profile/domain/education";
import { loadMyEducation } from "@/modules/profile/server/school";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mes notes" };

export default async function NotesPage() {
  const { supabase, user } = await requireUser();
  const [snapshot, scenarios, education] = await Promise.all([
    getAcademicSnapshot(),
    listScenarios(),
    loadMyEducation(supabase, user.id),
  ]);
  const dashboard = buildDashboard(snapshot);
  const names = new Map(snapshot.subjects.map((s) => [s.id, s.name]));
  const archived = snapshot.subjects.filter((s) => s.archived);
  // The study level only when the person gave one (Mes informations): never guessed.
  const description = education.studyLevel
    ? `${STUDY_LEVEL_LABELS[education.studyLevel].label} · tes matières, tes moyennes, tes priorités`
    : "Tes matières, tes moyennes, tes priorités.";

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Mes notes" description={description} />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline" size="lg" className="min-h-11 border-dashed">
            <Link href="/notes/importer#importer">
              <Upload aria-hidden /> Importer un relevé
            </Link>
          </Button>
          <ChunkyButton asChild size="lg" className="min-h-11">
            <Link href="/notes/importer#ajouter-matiere">Ajouter une matière</Link>
          </ChunkyButton>
        </div>
      </div>

      <NotesHero dashboard={dashboard} scenarioCount={scenarios.length} />
      <TargetForm target={snapshot.targetAverage} />

      <section aria-labelledby="matieres" className="space-y-4">
        <h2 id="matieres" className="text-xl font-extrabold">
          Matières et notes
        </h2>
        {dashboard.activeSubjects.length === 0 ? (
          <>
            <EmptyState
              icon={GraduationCap}
              title="Aucune matière pour l'instant"
              description="Ajoute ta première matière, ou pars d'un exemple. Tes notes restent privées."
            >
              <Button asChild className="min-h-11">
                <Link href="/notes/importer#ajouter-matiere">Ajouter ma première matière</Link>
              </Button>
            </EmptyState>
            {snapshot.subjects.length === 0 && <TemplateImport />}
          </>
        ) : (
          dashboard.activeSubjects.map((s, i) => <SubjectCard key={s.id} subject={s} tint={i} />)
        )}
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

      <Priorities dashboard={dashboard} subjectNames={names} />
      <ExamsCard exams={dashboard.upcomingExams} subjects={dashboard.activeSubjects} />
      <ConventionNote />
    </div>
  );
}
