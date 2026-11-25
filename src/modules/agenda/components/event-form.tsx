"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, FormMessage } from "@/modules/academic/components/fields";
import {
  EVENT_KINDS,
  KIND_LABELS,
  RECURRENCES,
  RECURRENCE_LABELS,
  type CalendarEvent,
  type Recurrence,
} from "../domain/types";
import { trimTime } from "../domain/occurrences";
import { addEvent, updateEvent } from "../server/actions";

type Props = {
  subjects: { id: string; name: string }[];
  /** Existing event to edit; omit to create. */
  event?: CalendarEvent;
  defaultDate: string;
  onDone?: () => void;
};

/** Creates or edits an event. Editing an event changes its whole series. */
export function EventForm({ subjects, event, defaultDate, onDone }: Props) {
  const [recurrence, setRecurrence] = useState<Recurrence>(event?.recurrence ?? "none");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const idp = event ? `edit-${event.id}-` : "new-";

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        const form = ev.currentTarget;
        const f = new FormData(form);
        const get = (k: string) => String(f.get(k) ?? "");
        const subjectId = get("subjectId");
        const input = {
          title: get("title"),
          kind: get("kind") as (typeof EVENT_KINDS)[number],
          subjectId: subjectId === "" ? null : subjectId,
          startsOn: get("startsOn"),
          startTime: get("startTime"),
          endTime: get("endTime"),
          recurrence,
          repeatUntil: get("repeatUntil"),
        };
        start(async () => {
          const res = event ? await updateEvent(event.id, input) : await addEvent(input);
          if (res.ok) {
            setErrors({});
            setMessage(null);
            if (!event) form.reset();
            onDone?.();
          } else {
            setErrors(res.error.fields ?? {});
            setMessage(res.error.fields ? null : res.error.message);
          }
        });
      }}
    >
      <Field
        id={`${idp}title`}
        label="Titre"
        name="title"
        maxLength={120}
        required
        defaultValue={event?.title ?? ""}
        error={errors.title}
      />
      <div className="space-y-1.5">
        <Label htmlFor={`${idp}kind`}>Type</Label>
        <NativeSelect id={`${idp}kind`} name="kind" className="w-full" defaultValue={event?.kind ?? "study"}>
          {EVENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idp}subjectId`}>Matière (facultatif)</Label>
        <NativeSelect
          id={`${idp}subjectId`}
          name="subjectId"
          className="w-full"
          defaultValue={event?.subjectId ?? ""}
        >
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Field
        id={`${idp}startsOn`}
        name="startsOn"
        label="Date"
        type="date"
        required
        defaultValue={event?.startsOn ?? defaultDate}
        error={errors.startsOn}
      />
      <Field
        id={`${idp}startTime`}
        name="startTime"
        label="Début"
        type="time"
        defaultValue={trimTime(event?.startTime ?? null) ?? ""}
        error={errors.startTime}
        hint="Vide = toute la journée"
      />
      <Field
        id={`${idp}endTime`}
        name="endTime"
        label="Fin"
        type="time"
        defaultValue={trimTime(event?.endTime ?? null) ?? ""}
        error={errors.endTime}
      />
      <div className="space-y-1.5">
        <Label htmlFor={`${idp}recurrence`}>Répétition</Label>
        <NativeSelect
          id={`${idp}recurrence`}
          name="recurrence"
          className="w-full"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
        >
          {RECURRENCES.map((r) => (
            <option key={r} value={r}>
              {RECURRENCE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
      </div>
      {recurrence !== "none" && (
        <Field
          id={`${idp}repeatUntil`}
          name="repeatUntil"
          label="Jusqu'au"
          type="date"
          required
          defaultValue={event && event.recurrence !== "none" ? event.lastOn : ""}
          error={errors.repeatUntil}
          hint="Un an au maximum"
        />
      )}
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending} className="min-h-11">
          {event ? "Enregistrer" : "Ajouter à l'agenda"}
        </Button>
        {event && (
          <Button type="button" variant="ghost" className="min-h-11" onClick={onDone}>
            Annuler
          </Button>
        )}
        {event && event.recurrence !== "none" && (
          <p className="text-xs text-muted-foreground">Modifie toute la série.</p>
        )}
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <FormMessage text={message} />
      </div>
    </form>
  );
}
