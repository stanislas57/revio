import type { Metadata } from "next";
import { BarChart3, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelCard } from "@/modules/gamification/components/level-card";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { StatTiles } from "@/modules/gamification/components/stat-tiles";
import { StreakCard } from "@/modules/gamification/components/streak-card";
import { getMyGamification } from "@/modules/gamification/server/queries";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { SettingsForm } from "@/modules/profile/components/settings-form";
import { getMyProfile, getMySettings } from "@/modules/profile/server/queries";
import { SectionLinks } from "@/modules/social/components/section-links";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const [profile, stats, settings] = await Promise.all([
    getMyProfile(),
    getMyGamification(),
    getMySettings(),
  ]);

  return (
    <>
      <PageHeader title="Profil" description="Ta progression et ton identité visible par tes amis." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <LevelCard level={stats.level} />
          <StreakCard streak={stats.streak} days={stats.days} />
        </div>
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

        <Card id="reglages" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Réglages</CardTitle>
            <CardDescription>
              Privés : seuls toi et le serveur y avez accès. Ta matière n&apos;est jamais partagée sans ton
              accord.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
