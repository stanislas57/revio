import type { Metadata } from "next";
import { HomeNotesCard } from "@/modules/academic/components/home-notes-card";
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
  const [snapshot, profile, stats, friends, live, agenda] = await Promise.all([
    getAcademicSnapshot(),
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
        <HomeNotesCard dashboard={dashboard} subjectNames={names} />
        <div className="sm:col-span-2 lg:col-span-3">
          <HomeUpcomingCard items={upcoming} today={today} />
        </div>
      </section>
    </div>
  );
}
