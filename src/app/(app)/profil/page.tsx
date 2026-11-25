import type { Metadata } from "next";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { BarChart3, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelCard } from "@/modules/gamification/components/level-card";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { StatTiles } from "@/modules/gamification/components/stat-tiles";
import { StreakCard } from "@/modules/gamification/components/streak-card";
import { getMyGamification } from "@/modules/gamification/server/queries";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { LanguageSelector } from "@/modules/profile/components/language-selector";
import { SettingsForm } from "@/modules/profile/components/settings-form";
import { SETTINGS_MESSAGES } from "@/modules/profile/domain/settings-messages";
import { getLocale } from "@/modules/profile/server/locale";
import { getMyProfile, getMySettings } from "@/modules/profile/server/queries";
import { SectionLinks } from "@/modules/social/components/section-links";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const [profile, stats, settings, locale] = await Promise.all([
    getMyProfile(),
    getMyGamification(),
    getMySettings(),
    getLocale(),
  ]);
  const m = SETTINGS_MESSAGES[locale];

  return (
    <>
      <PageHeader title="Profil" description="Ta progression et ton identité visible par tes amis." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <LevelCard level={stats.level} />
          <StreakCard streak={stats.streak} days={stats.days} />
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
        <StatTiles totalMinutes={stats.totalMinutes} sessions={stats.sessionsCount} />

        <SectionLinks
          label="Trophées et statistiques"
          links={[
            {
              href: "/profil/trophees",
              title: "Trophées",
              description: "Tes succès, en cours et à débloquer.",
              icon: Trophy,
              mock: true,
            },
            {
              href: "/profil/statistiques",
              title: "Statistiques",
              description: "Temps par jour, par matière, régularité.",
              icon: BarChart3,
              mock: true,
            },
          ]}
        />

        <Card>
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
      </div>
    </>
  );
}
