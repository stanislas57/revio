"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Repeat, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLongDate } from "../domain/dates";
import { formatDuration, durationMinutes, itemState, progress } from "../domain/timetable";
import { KIND_LABELS, PLAN_STATUS_LABELS, type AgendaItem, type CalendarEvent } from "../domain/types";
import { deleteEvent } from "../server/actions";
import { setPlanStatus } from "@/modules/planning/server/actions";
import { cardClass, tintOf } from "./kind-style";
import { EventForm } from "./event-form";

type Props = {
  date: string;
  today: string;
  /** Minutes since midnight in the user's time zone (the page's snapshot), to show what is done and in progress. */
  nowMinutes: number;
  items: AgendaItem[];
  conflicts: Set<string>;
  events: Map<string, CalendarEvent>;
  subjects: { id: string; name: string }[];
};

/** The dot of the timeline: a check when done, a pink ring when in progress, a hollow circle when still to come. */
function Node({ state }: { state: "past" | "current" | "future" }) {
  if (state === "past") {
    return (
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-revio-social/25">
        <span className="size-4 rounded-full bg-revio-social-text" />
      </span>
    );
  }
  return (
    <span aria-hidden className="grid size-8 place-items-center">
      <span className="size-4 rounded-full border-[3px] border-primary bg-card" />
    </span>
  );
}

/**
 * One day of the agenda as a vertical timeline (done, in progress, to come), with edit / delete for events
 * (exams are managed on Accueil).
 */
export function AgendaDay({ date, today, nowMinutes, items, conflicts, events, subjects }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const names = new Map(subjects.map((s) => [s.id, s.name]));

  function changeStatus(id: string, status: "accepted" | "locked") {
    start(async () => {
      const res = await setPlanStatus(id, status);
      setMessage(res.ok ? null : res.error.message);
    });
  }

  return (
    <section aria-label={formatLongDate(date)} className="space-y-3">
      <h2 className="text-center text-xl font-extrabold first-letter:uppercase md:text-left">
        {formatLongDate(date)}
        {date === today && (
          <Badge variant="secondary" className="ml-2 align-middle normal-case">
            Aujourd&apos;hui
          </Badge>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Rien de prévu.
        </p>
      ) : (
        <ul className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-0.5 before:bg-brand-soft">
          {items.map((item) => {
            const event = item.source === "event" ? events.get(item.id) : undefined;
            if (event && editing === item.key) {
              return (
                <li key={item.key} className="relative rounded-3xl border bg-card p-4 text-left">
                  <EventForm
                    subjects={subjects}
                    event={event}
                    defaultDate={item.date}
                    onDone={() => setEditing(null)}
                  />
                </li>
              );
            }
            const state = itemState(item, today, nowMinutes);
            const timed = item.startTime !== null && item.endTime !== null;
            const now =
              state === "current" && timed
                ? progress({ startTime: item.startTime!, endTime: item.endTime! }, nowMinutes)
                : null;
            return (
              <li key={item.key} className="relative flex gap-3">
                <span className="relative z-10 shrink-0 pt-3">
                  <Node state={state} />
                </span>
                <div
                  className={cn(
                    "min-w-0 flex-1 space-y-2 rounded-3xl p-4 text-left text-sm",
                    cardClass(item.kind, tintOf(item.subjectId, subjects)),
                    now && "ring-2 ring-revio-social-text",
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold tabular-nums">
                      {now && <span className="mr-2 uppercase">En cours</span>}
                      {timed
                        ? `${item.startTime}–${item.endTime} · ${formatDuration(durationMinutes(item))}`
                        : "Journée"}
                    </p>
                    <p className="text-lg leading-snug font-extrabold break-words">{item.title}</p>
                  </div>
                  {now && (
                    <div className="space-y-1">
                      <div aria-hidden className="h-2 overflow-hidden rounded-pill bg-white/50">
                        <div
                          className="h-full rounded-pill bg-revio-social-text"
                          style={{ width: `${now.percent}%` }}
                        />
                      </div>
                      <p className="text-xs">Fin dans {formatDuration(now.minutesLeft)}</p>
                    </div>
                  )}
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span>{KIND_LABELS[item.kind]}</span>
                    {item.subjectId && names.get(item.subjectId) && (
                      <span>· {names.get(item.subjectId)}</span>
                    )}
                    {item.recurring && (
                      <span className="inline-flex items-center gap-1">
                        <Repeat className="size-3" aria-hidden /> répété
                      </span>
                    )}
                    {conflicts.has(item.key) && (
                      <span className="inline-flex items-center gap-1 font-bold">
                        <TriangleAlert className="size-3" aria-hidden /> chevauche un autre créneau
                      </span>
                    )}
                    {item.planStatus && (
                      <Badge variant="secondary" className="text-secondary-foreground">
                        {PLAN_STATUS_LABELS[item.planStatus]}
                      </Badge>
                    )}
                    {item.source === "exam" && <span>· modifiable depuis l&apos;Accueil</span>}
                  </p>
                  {item.planReason && (
                    <details className="text-xs">
                      <summary className="min-h-6 cursor-pointer">Pourquoi cette séance ?</summary>
                      <p className="mt-1">{item.planReason}</p>
                    </details>
                  )}
                  {event && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.planStatus === "recommended" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-11 shadow-none"
                          disabled={pending}
                          aria-label={`Accepter ${item.title}`}
                          onClick={() => changeStatus(event.id, "accepted")}
                        >
                          Accepter
                        </Button>
                      )}
                      {item.planStatus === "accepted" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-11 shadow-none"
                          disabled={pending}
                          aria-label={`Verrouiller ${item.title}`}
                          onClick={() => changeStatus(event.id, "locked")}
                        >
                          Verrouiller
                        </Button>
                      )}
                      {item.planStatus === "locked" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-11 shadow-none"
                          disabled={pending}
                          aria-label={`Déverrouiller ${item.title}`}
                          onClick={() => changeStatus(event.id, "accepted")}
                        >
                          Déverrouiller
                        </Button>
                      )}
                      <Button
                        size="icon-lg"
                        variant="secondary"
                        className="shadow-none"
                        aria-label={`Modifier ${item.title}`}
                        onClick={() => setEditing(item.key)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-lg"
                        variant="secondary"
                        className="shadow-none"
                        aria-label={`Supprimer ${item.title}`}
                        disabled={pending}
                        onClick={() => {
                          if (
                            event.recurrence !== "none" &&
                            !window.confirm("Supprimer tout l'événement répété (toutes les occurrences) ?")
                          )
                            return;
                          start(async () => {
                            const res = await deleteEvent(event.id);
                            setMessage(res.ok ? null : res.error.message);
                          });
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </section>
  );
}
