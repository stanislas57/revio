import type { Metadata } from "next";
import Link from "next/link";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { ActiveSessionPanel } from "@/modules/focus/components/active-session";
import { RecentSessions } from "@/modules/focus/components/recent-sessions";
import { StartSessionForm } from "@/modules/focus/components/start-session-form";
import { getMySettings } from "@/modules/profile/server/queries";
import { getActiveSession, getRecentSessions, listMySubjects } from "@/modules/focus/server/queries";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage() {
  const [active, recent, subjects, settings] = await Promise.all([
    getActiveSession(),
    getRecentSessions(),
    listMySubjects(),
    getMySettings(),
  ]);
  return (
    <>
      <PageHeader title="Focus" description="Lance une séance de révision chronométrée et gagne de l'XP." />
      <div className="space-y-6">
        {active ? (
          <ActiveSessionPanel session={active} />
        ) : (
          <StartSessionForm subjects={subjects} defaultShare={settings.shareSessionsByDefault} />
        )}
        <section className="space-y-3" aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-lg font-semibold">
            Séances récentes
          </h2>
          {recent.length > 0 ? (
            <RecentSessions sessions={recent} />
          ) : (
            <EmptyState
              icon={Timer}
              title="Aucune séance pour l'instant"
              description="Chaque minute de révision rapporte 1 XP, dès 5 minutes de séance. Tes séances terminées apparaîtront ici."
            >
              {!active && (
                <Button asChild className="min-h-11">
                  <Link href="#nouvelle-seance">Lance ta première séance</Link>
                </Button>
              )}
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
