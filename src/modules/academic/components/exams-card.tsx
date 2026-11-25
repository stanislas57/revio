"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { UpcomingExam } from "../domain/dashboard";
import { formatShortDate } from "../domain/dates";
import type { Subject } from "../domain/types";
import { addExam, deleteExam } from "../server/actions";
import { Field, FormMessage } from "./fields";

function when(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  return `dans ${days} jours`;
}

export function ExamsCard({ exams, subjects }: { exams: UpcomingExam[]; subjects: Subject[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Examens à venir</CardTitle>
        <CardDescription>Un examen proche remonte la matière dans tes priorités.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun examen à venir.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium break-words">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(e.examOn)} · {when(e.inDays)}
                    {e.subjectName ? ` · ${e.subjectName}` : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer l'examen ${e.title}`}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteExam(e.id);
                      setMessage(res.ok ? null : res.error.message);
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(ev) => {
            ev.preventDefault();
            const form = ev.currentTarget;
            const f = new FormData(form);
            const subjectId = String(f.get("subjectId") ?? "");
            start(async () => {
              const res = await addExam({
                title: String(f.get("title") ?? ""),
                examOn: String(f.get("examOn") ?? ""),
                subjectId: subjectId === "" ? null : subjectId,
              });
              if (res.ok) {
                setErrors({});
                setMessage(null);
                form.reset();
              } else {
                setErrors(res.error.fields ?? {});
                setMessage(res.error.fields ? null : res.error.message);
              }
            });
          }}
        >
          <Field id="title" label="Examen" maxLength={120} required error={errors.title} />
          <Field id="examOn" label="Date" type="date" required error={errors.examOn} />
          <div className="space-y-1.5">
            <Label htmlFor="subjectId">Matière (facultatif)</Label>
            <NativeSelect id="subjectId" name="subjectId" className="w-full" defaultValue="">
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" variant="outline" disabled={pending}>
              Ajouter l&apos;examen
            </Button>
          </div>
        </form>
        <FormMessage text={message} />
      </CardContent>
    </Card>
  );
}
