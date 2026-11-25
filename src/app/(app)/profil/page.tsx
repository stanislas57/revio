import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { LevelCard } from "@/modules/gamification/components/level-card";
import { LevelLadder } from "@/modules/gamification/components/level-ladder";
import { StatTiles } from "@/modules/gamification/components/stat-tiles";
import { StreakCard } from "@/modules/gamification/components/streak-card";
import { getMyGamification } from "@/modules/gamification/server/queries";
import { ProfileForm } from "@/modules/profile/components/profile-form";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, stats] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user.id).maybeSingle(),
    getMyGamification(),
  ]);

  return (
    <>
      <PageHeader title="Profil" description="Ta progression et ton identité visible par tes amis." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <LevelCard totalXp={stats.total_xp} />
          <StreakCard current={stats.current_streak} best={stats.best_streak} days={stats.days} />
        </div>
        <StatTiles totalMinutes={stats.total_minutes} sessions={stats.completed_sessions} />

        <Card>
          <CardHeader>
            <CardTitle>Niveaux</CardTitle>
            <CardDescription>Seuils provisoires, susceptibles d&apos;évoluer.</CardDescription>
          </CardHeader>
          <CardContent>
            <LevelLadder totalXp={stats.total_xp} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
            <CardDescription>
              {user.email}. Tes notes et matières ne sont jamais visibles par tes amis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm username={profile?.username ?? ""} displayName={profile?.display_name ?? ""} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
