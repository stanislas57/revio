import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotImplemented } from "@/components/states/not-implemented";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaDay } from "@/modules/agenda/components/agenda-day";
import { AgendaToolbar } from "@/modules/agenda/components/agenda-toolbar";
import { EventForm } from "@/modules/agenda/components/event-form";
import { MonthGrid } from "@/modules/agenda/components/month-grid";
import { startOfMonth } from "@/modules/agenda/domain/dates";
import { expandRange, findConflicts } from "@/modules/agenda/domain/occurrences";
import { viewRange } from "@/modules/agenda/domain/range";
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
        <NotImplemented feature="Génération automatique du planning de révision (l'agenda est pour l'instant rempli à la main)." />
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

        <Card>
          <CardHeader>
            <CardTitle>Ajouter à l&apos;agenda</CardTitle>
            <CardDescription>
              Heures de ton fuseau ({settings.timezone}). Un événement ne peut pas passer minuit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm subjects={data.subjects} defaultDate={date} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
