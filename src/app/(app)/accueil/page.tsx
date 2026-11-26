import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSummary } from "@/modules/academic/components/dashboard-summary";
import { DocumentImport } from "@/modules/academic/components/document-import";
import { ExamsCard } from "@/modules/academic/components/exams-card";
import { Simulator } from "@/modules/academic/components/simulator";
import { ScenarioSimulator } from "@/modules/academic/components/scenario-simulator";
import { SubjectCard } from "@/modules/academic/components/subject-card";
import { SubjectForm } from "@/modules/academic/components/subject-form";
import { TargetForm } from "@/modules/academic/components/target-form";
import { TemplateImport } from "@/modules/academic/components/template-import";
import { TimePlanner } from "@/modules/academic/components/time-planner";
import { buildDashboard } from "@/modules/academic/domain/dashboard";
import { HomeUpcomingCard } from "@/modules/agenda/components/home-upcoming-card";
import { expandRange } from "@/modules/agenda/domain/occurrences";
import { upcomingItems, upcomingWindowEnd } from "@/modules/agenda/domain/upcoming";
import { getAgendaData } from "@/modules/agenda/server/queries";
import { todayIso } from "@/modules/academic/domain/dates";
import { HomeSessionsCard } from "@/modules/focus/components/home-sessions-card";
import { HomeLevelCard, HomeStreakCard } from "@/modules/gamification/components/home-cards";
import { getMyGamification } from "@/modules/gamification/server/queries";
import { getMyProfile, loadSettings } from "@/modules/profile/server/queries";
import { HomeFriendsCard } from "@/modules/social/components/home-friends-card";
import { getLiveFriends, listFriends } from "@/modules/social/server/queries";
import { requireUser } from "@/lib/auth";
import { getAcademicSnapshot } from "@/modules/academic/server/queries";
import { deleteScenario, saveScenario } from "@/modules/academic/server/scenario-actions";
import { listScenarios } from "@/modules/academic/server/scenarios";

export const metadata: Metadata = { title: "Accueil" };

/** Current wall-clock time "HH:MM" in the user's time zone (to skip today's agenda items that are over). */
function nowTime(timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

export default async function AccueilPage() {
  const { supabase, user } = await requireUser();
  const settings = await loadSettings(supabase, user.id);
  const today = todayIso(settings.timezone);
  const [snapshot, scenarios, profile, stats, friends, live, agenda] = await Promise.all([
    getAcademicSnapshot(),
    listScenarios(),
    getMyProfile(),
    getMyGamification(),
    listFriends(),
    getLiveFriends(),
    getAgendaData(today, upcomingWindowEnd(today)),
  ]);
  const upcoming = upcomingItems(
    expandRange(agenda.events, agenda.exams, today, upcomingWindowEnd(today)),
    today,
    nowTime(settings.timezone),
  );
  // An empty display name falls back to the username.
  const name = profile.displayName || profile.username;
  const dashboard = buildDashboard(snapshot);
  const names = new Map(snapshot.subjects.map((s) => [s.id, s.name]));
  const archived = snapshot.subjects.filter((s) => s.archived);

  return (
    <div data-page-background="landing" className="space-y-10">
      {/* The landing's first slogan, same words and same typography (charter bêta 01). */}
      <section aria-labelledby="home-title" className="space-y-4 pt-6 pb-2 text-center sm:pt-10">
        <p className="inline-flex items-center rounded-pill bg-brand-soft px-3 py-1 text-xs font-bold tracking-wide text-brand-soft-foreground uppercase">
          Accueil{name ? ` · Salut, ${name} !` : ""}
        </p>
        <h1
          id="home-title"
          className="landing-display text-[2.625rem] leading-[0.98] text-balance sm:text-[4rem] lg:text-[5.5rem]"
        >
          Moins de stress.
          <br />
          <em className="text-brand-text">Plus de progrès.</em>
        </h1>
      </section>

      <section aria-label="Ton tableau de bord" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <HomeLevelCard level={stats.level} />
        </div>
        <HomeStreakCard streak={stats.streak} />
        <HomeSessionsCard sessions={stats.sessionsCount} totalMinutes={stats.totalMinutes} />
        <HomeFriendsCard friends={friends.length} studyingNow={live.length} />
        <HomeUpcomingCard items={upcoming} today={today} />
      </section>

      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold">Mes notes</h2>
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
          <DocumentImport />
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
    </div>
  );
}
