import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotImplemented } from "@/components/states/not-implemented";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const { supabase, user } = await requireUser();
  // Real data: RLS lets a signed-in user read profiles.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader title="Profil" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">E-mail : </span>
              {user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Pseudo : </span>
              {profile?.username ?? "non défini"}
            </p>
          </CardContent>
        </Card>
        <NotImplemented feature="Modification du profil (pseudo, nom affiché, avatar), niveau et trophées." />
      </div>
    </>
  );
}
