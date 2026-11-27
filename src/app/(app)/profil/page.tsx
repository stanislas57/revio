import type { Metadata } from "next";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { BarChart3, Trophy } from "lucide-react";
import { MotionToggle } from "@/components/layout/motion-preference";
import { NavLayoutSwitcher } from "@/components/layout/nav-layout-switcher";
import { LinkCard } from "@/components/revio/link-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelCard } from "@/modules/gamification/components/level-card";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { StatTiles } from "@/modules/gamification/components/stat-tiles";
import { StreakPanel } from "@/modules/gamification/components/streak-panel";
import { getMyGamification } from "@/modules/gamification/server/queries";
import { RemindersMock } from "@/modules/profile/components/reminders-mock";
import { MyData } from "@/modules/profile/components/my-data";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { LanguageSelector } from "@/modules/profile/components/language-selector";
import { EducationDetailsForm } from "@/modules/profile/components/education-details-form";
import { SchoolPicker } from "@/modules/profile/components/school-picker";
import { loadMyEducation } from "@/modules/profile/server/school";
import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/modules/profile/components/settings-form";
import { SETTINGS_MESSAGES } from "@/modules/profile/domain/settings-messages";
import { getLocale } from "@/modules/profile/server/locale";
import { getMyProfile, getMySettings } from "@/modules/profile/server/queries";
import { SectionLinks } from "@/modules/social/components/section-links";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const { supabase, user } = await requireUser();
  const [profile, stats, settings, locale, education] = await Promise.all([
    getMyProfile(),
    getMyGamification(),
    getMySettings(),
    getLocale(),
    loadMyEducation(supabase, user.id),
  ]);
  const m = SETTINGS_MESSAGES[locale];

  return (
    <>
      <PageHeader title="Profil" description="Ta progression et ton identité visible par tes amis." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <LinkCard href="#niveaux" label="Voir tous les niveaux">
            <LevelCard level={stats.level} />
          </LinkCard>
          <LinkCard href="/profil/statistiques" label="Voir mes statistiques" className="self-start">
            <StreakPanel streak={stats.streak} days={stats.days} />
          </LinkCard>
        </div>
        {stats.sessionsCount === 0 && (
          <EmptyState
            icon={Sprout}
            title="Ta progression démarre avec ta première séance"
            description="Ton niveau, ta série et ton temps révisé se remplissent dès ta première séance Focus. Tes amis verront ton niveau, jamais tes notes."
          >
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild className="min-h-11">
                <Link href="/focus">Lance ta première séance</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/social#ajouter-ami">Ajoute ton premier ami</Link>
              </Button>
            </div>
          </EmptyState>
        )}
        <LinkCard href="/profil/statistiques" label="Voir mes statistiques détaillées">
          <StatTiles totalMinutes={stats.totalMinutes} sessions={stats.sessionsCount} />
        </LinkCard>

        <SectionLinks
          label="Trophées et statistiques"
          links={[
            {
              href: "/profil/trophees",
              title: "Trophées",
              description: "Tes succès, en cours et à débloquer.",
              icon: Trophy,
            },
            {
              href: "/profil/statistiques",
              title: "Statistiques",
              description: "Temps par jour, par matière, régularité.",
              icon: BarChart3,
            },
          ]}
        />

        <Card id="niveaux" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Niveaux</CardTitle>
            <CardDescription>Seuils provisoires, susceptibles d&apos;évoluer.</CardDescription>
          </CardHeader>
          <CardContent>
            <LevelLadder currentLevel={stats.level.current.number} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
            <CardDescription>
              <span className="break-all">{profile.email}</span>. Tes notes et matières ne sont jamais
              visibles par tes amis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm username={profile.username ?? ""} displayName={profile.displayName} />
          </CardContent>
        </Card>

        <Card id="mes-informations" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Mes informations</CardTitle>
            <CardDescription>
              École, niveau d&apos;études et, si tu le souhaites, ton sexe : demandés à l&apos;inscription,
              modifiables ici. Visibles par toi seul, jamais par tes amis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            <section id="ecole" aria-labelledby="ecole-title" className="scroll-mt-20 space-y-4">
              <h3 id="ecole-title" className="text-xl font-extrabold">
                Mon école
              </h3>
              <SchoolPicker current={education.school} />
            </section>
            <EducationDetailsForm studyLevel={education.studyLevel} gender={education.gender} />
          </CardContent>
        </Card>

        <Card id="apparence" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>
              Où se trouve le menu (enregistré sur ton compte), et les animations de l&apos;interface (sur cet
              appareil).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <NavLayoutSwitcher />
            <MotionToggle />
          </CardContent>
        </Card>

        <Card id="reglages" lang={locale} className="scroll-mt-20">
          <CardHeader>
            <CardTitle>{m.title}</CardTitle>
            <CardDescription>{m.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LanguageSelector locale={locale} />
            <SettingsForm settings={settings} locale={locale} />
          </CardContent>
        </Card>

        <RemindersMock />
        <MyData />
      </div>
    </>
  );
}
