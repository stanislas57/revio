import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ActiveSessionPanel } from "@/modules/focus/components/active-session";
import { RecentSessions } from "@/modules/focus/components/recent-sessions";
import { StartSessionForm } from "@/modules/focus/components/start-session-form";
import { getActiveSession, getRecentSessions } from "@/modules/focus/server/queries";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage() {
  const [active, recent] = await Promise.all([getActiveSession(), getRecentSessions()]);
  return (
    <>
      <PageHeader title="Focus" description="Lance une séance de révision chronométrée et gagne de l'XP." />
      <div className="space-y-6">
        {active ? <ActiveSessionPanel session={active} /> : <StartSessionForm />}
        <section className="space-y-3" aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-lg font-semibold">
            Séances récentes
          </h2>
          {recent.length > 0 ? (
            <RecentSessions sessions={recent} />
          ) : (
            <EmptyState
              icon={Timer}
              title="Aucune séance"
              description="Tes séances terminées apparaîtront ici."
            />
          )}
        </section>
      </div>
    </>
  );
}
