import Link from "next/link";
import { OrganicCard } from "@/components/revio/organic-card";
import { daysBetween, formatLongDate } from "../domain/dates";
import { countdownLabel, formatDuration, type WeekSummary } from "../domain/timetable";
import type { ExamItem } from "../domain/types";

/**
 * Three cards above the week: the next test, the revision planned this week and the courses of the week. Only
 * what the agenda really holds (events and exams typed by the user): nothing is synchronised from a school.
 */
export function SummaryCards({
  nextExam,
  today,
  summary,
}: {
  nextExam: ExamItem | null;
  today: string;
  summary: WeekSummary;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nextExam ? (
        <OrganicCard tone="primary" aria-label="Prochain contrôle" role="group" className="gap-1">
          <p className="text-sm font-semibold">Prochain contrôle</p>
          <p className="text-3xl font-extrabold">{countdownLabel(daysBetween(today, nextExam.examOn))}</p>
          <p className="font-semibold">{nextExam.title}</p>
          <p className="text-sm first-letter:uppercase">{formatLongDate(nextExam.examOn)}</p>
        </OrganicCard>
      ) : (
        <OrganicCard role="group" aria-label="Prochain contrôle" className="gap-1">
          <p className="text-sm font-semibold text-muted-foreground">Prochain contrôle</p>
          <p className="text-xl font-extrabold">Aucun à venir</p>
          <p className="text-sm text-muted-foreground">
            Ajoutes-en un plus bas, dans « Ajouter à l&apos;agenda ».
          </p>
        </OrganicCard>
      )}

      <OrganicCard role="group" aria-label="Révision prévue cette semaine" className="gap-1">
        <p className="text-sm font-semibold text-muted-foreground">Révision prévue cette semaine</p>
        <p className="text-3xl font-extrabold">{formatDuration(summary.studyMinutes)}</p>
        {summary.studyMinutes === 0 ? (
          <Link
            href="#ajouter"
            className="text-sm font-semibold text-brand-text underline underline-offset-4"
          >
            Planifier une révision
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Les créneaux de révision de ton agenda.</p>
        )}
      </OrganicCard>

      <OrganicCard
        role="group"
        aria-label="Cours cette semaine"
        className="gap-1 sm:col-span-2 lg:col-span-1"
      >
        <p className="text-sm font-semibold text-muted-foreground">Cours cette semaine</p>
        <p className="text-3xl font-extrabold">{formatDuration(summary.classMinutes)}</p>
        <p className="text-sm text-muted-foreground">
          {summary.classCount === 0 ? "Aucun cours dans ton agenda." : `${summary.classCount} cours`}
        </p>
      </OrganicCard>
    </div>
  );
}
