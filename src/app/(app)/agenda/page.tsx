import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaDay } from "@/modules/agenda/components/agenda-day";
import { AgendaHeader } from "@/modules/agenda/components/agenda-header";
import { DayStrip } from "@/modules/agenda/components/day-strip";
import { EventForm } from "@/modules/agenda/components/event-form";
import { QuickAdd } from "@/modules/agenda/components/quick-add";
import { Legend } from "@/modules/agenda/components/legend";
import { MonthGrid } from "@/modules/agenda/components/month-grid";
import { SummaryCards } from "@/modules/agenda/components/summary-cards";
import { UpcomingExams } from "@/modules/agenda/components/upcoming-exams";
import { WeekGrid } from "@/modules/agenda/components/week-grid";
import { startOfMonth } from "@/modules/agenda/domain/dates";
import { localNow, summarize } from "@/modules/agenda/domain/timetable";
import { expandRange, findConflicts } from "@/modules/agenda/domain/occurrences";
import { viewRange } from "@/modules/agenda/domain/range";
import { PlanCard } from "@/modules/planning/components/plan-card";
import { getAgendaData, getUpcomingExams } from "@/modules/agenda/server/queries";
import { viewParamsSchema } from "@/modules/agenda/schemas";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/modules/profile/server/queries";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = viewParamsSchema.parse({
    vue: Array.isArray(raw.vue) ? raw.vue[0] : raw.vue,
    date: Array.isArray(raw.date) ? raw.date[0] : raw.date,
  });
  const { supabase, user } = await requireUser();
  const settings = await loadSettings(supabase, user.id);
  // The page is a snapshot: "today" and "now" are read once, in the user's time zone.
  const now = localNow(settings.timezone);
  const today = now.date;
  const date = params.date ?? today;
  const { from, to } = viewRange(params.vue, date);
  // The day view also shows the seven days of its week (the strip above the timeline).
  const week = viewRange("semaine", date);
  const fetched = params.vue === "jour" ? week : { from, to };

  const [data, upcoming] = await Promise.all([
    getAgendaData(fetched.from, fetched.to),
    params.vue === "jour" ? Promise.resolve([]) : getUpcomingExams(today, 3),
  ]);
  const byDay = expandRange(data.events, data.exams, fetched.from, fetched.to);
  const events = new Map(data.events.map((e) => [e.id, e]));

  return (
    <>
      <div className="space-y-6">
        <AgendaHeader view={params.vue} date={date} today={today} from={from} to={to} />

        {params.vue === "semaine" && (
          <>
            <SummaryCards nextExam={upcoming[0] ?? null} today={today} summary={summarize(byDay, from, to)} />
            <Legend withNow />
            <WeekGrid
              from={from}
              today={today}
              nowMinutes={now.minutes}
              byDay={byDay}
              subjects={data.subjects}
            />
          </>
        )}

        {params.vue === "mois" && (
          <>
            <MonthGrid
              from={from}
              to={to}
              month={startOfMonth(date).slice(0, 7)}
              today={today}
              byDay={byDay}
            />
            <Legend />
            <UpcomingExams exams={upcoming} today={today} />
          </>
        )}

        {params.vue === "jour" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <DayStrip date={date} today={today} weekFrom={week.from} byDay={byDay} />
            <AgendaDay
              date={date}
              today={today}
              nowMinutes={now.minutes}
              items={byDay.get(date) ?? []}
              conflicts={findConflicts(byDay.get(date) ?? [])}
              events={events}
              subjects={data.subjects}
            />
          </div>
        )}

        <PlanCard hasRecommended={data.events.some((e) => e.planStatus === "recommended")} />

        <Card id="ajouter" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Ajouter à l&apos;agenda</CardTitle>
            <CardDescription>Sans rien taper : choisis, étape par étape.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <QuickAdd subjects={data.subjects} today={today} />
            <details className="rounded-2xl border p-4">
              <summary className="min-h-11 cursor-pointer text-sm font-bold">
                Saisie détaillée (heure précise, répétition, date libre)
              </summary>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Heures de ton fuseau ({settings.timezone}). Un événement ne peut pas passer minuit.
                </p>
                <EventForm subjects={data.subjects} defaultDate={date} />
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
