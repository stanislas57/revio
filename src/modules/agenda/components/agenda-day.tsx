"use client";

import { useState, useTransition } from "react";
import { Pencil, Repeat, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "../domain/dates";
import { KIND_LABELS, PLAN_STATUS_LABELS, type AgendaItem, type CalendarEvent } from "../domain/types";
import { deleteEvent } from "../server/actions";
import { setPlanStatus } from "@/modules/planning/server/actions";
import { EventForm } from "./event-form";

type Props = {
  date: string;
  today: string;
  items: AgendaItem[];
  conflicts: Set<string>;
  events: Map<string, CalendarEvent>;
  subjects: { id: string; name: string }[];
};

/** One day of the agenda: its items, with edit / delete for events (exams are managed on Accueil). */
export function AgendaDay({ date, today, items, conflicts, events, subjects }: Props) {
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
    <section aria-label={formatLongDate(date)} className="space-y-2">
      <h3 className="text-sm font-semibold capitalize">
        {formatLongDate(date)}
        {date === today && (
          <Badge variant="secondary" className="ml-2 align-middle normal-case">
            Aujourd&apos;hui
          </Badge>
        )}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rien de prévu.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => {
            const event = item.source === "event" ? events.get(item.id) : undefined;
            if (event && editing === item.key) {
              return (
                <li key={item.key} className="p-3">
                  <EventForm
                    subjects={subjects}
                    event={event}
                    defaultDate={item.date}
                    onDone={() => setEditing(null)}
                  />
                </li>
              );
            }
            return (
              <li key={item.key} className="flex items-center justify-between gap-2 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium break-words">
                    {item.startTime && item.endTime ? (
                      <span className="mr-2 text-muted-foreground tabular-nums">
                        {item.startTime}–{item.endTime}
                      </span>
                    ) : (
                      <span className="mr-2 text-muted-foreground">Journée</span>
                    )}
                    {item.title}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
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
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <TriangleAlert className="size-3" aria-hidden /> chevauche un autre créneau
                      </span>
                    )}
                    {item.planStatus && (
                      <Badge variant={item.planStatus === "recommended" ? "outline" : "secondary"}>
                        {PLAN_STATUS_LABELS[item.planStatus]}
                      </Badge>
                    )}
                    {item.source === "exam" && <span>· modifiable depuis l&apos;Accueil</span>}
                  </p>
                  {item.planReason && (
                    <details className="mt-1 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Pourquoi cette séance ?</summary>
                      <p className="mt-1">{item.planReason}</p>
                    </details>
                  )}
                </div>
                {event && (
                  <div className="flex shrink-0 items-center">
                    {item.planStatus === "recommended" && (
                      <Button
                        size="sm"
                        variant="outline"
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
                        variant="ghost"
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
                        variant="ghost"
                        disabled={pending}
                        aria-label={`Déverrouiller ${item.title}`}
                        onClick={() => changeStatus(event.id, "accepted")}
                      >
                        Déverrouiller
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Modifier ${item.title}`}
                      onClick={() => setEditing(item.key)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
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
