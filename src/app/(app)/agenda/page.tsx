import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaDay } from "@/modules/agenda/components/agenda-day";
import { AgendaToolbar } from "@/modules/agenda/components/agenda-toolbar";
import { EventForm } from "@/modules/agenda/components/event-form";
import { QuickAdd } from "@/modules/agenda/components/quick-add";
import { MonthGrid } from "@/modules/agenda/components/month-grid";
import { startOfMonth } from "@/modules/agenda/domain/dates";
import { expandRange, findConflicts } from "@/modules/agenda/domain/occurrences";
import { viewRange } from "@/modules/agenda/domain/range";
import { PlanCard } from "@/modules/planning/components/plan-card";
import { getAgendaData } from "@/modules/agenda/server/queries";
import { viewParamsSchema } from "@/modules/agenda/schemas";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/modules/profile/server/queries";
import { todayIso } from "@/modules/academic/domain/dates";

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
  const today = todayIso(settings.timezone);
  const date = params.date ?? today;
  const { from, to } = viewRange(params.vue, date);

  const data = await getAgendaData(from, to);
  const byDay = expandRange(data.events, data.exams, from, to);
  const events = new Map(data.events.map((e) => [e.id, e]));
  const days = [...byDay.keys()];

  return (
    <>
      <PageHeader title="Agenda" description="Tes examens, cours, indisponibilités et séances de révision." />
      <div className="space-y-6">
        <PlanCard hasRecommended={data.events.some((e) => e.planStatus === "recommended")} />
        <AgendaToolbar view={params.vue} date={date} today={today} from={from} to={to} />

        {params.vue === "mois" ? (
          <MonthGrid from={from} to={to} month={startOfMonth(date).slice(0, 7)} today={today} byDay={byDay} />
        ) : (
          <div className="space-y-5">
            {days.map((d) => (
              <AgendaDay
                key={d}
                date={d}
                today={today}
                items={byDay.get(d) ?? []}
                conflicts={findConflicts(byDay.get(d) ?? [])}
                events={events}
                subjects={data.subjects}
              />
            ))}
          </div>
        )}

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
