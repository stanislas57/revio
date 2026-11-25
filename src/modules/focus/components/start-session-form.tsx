"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { SubjectRef } from "../domain/session-row";
import { startSession } from "../server/actions";

const DURATIONS = [
  { value: "", label: "Chrono libre" },
  { value: "25", label: "25 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 h" },
  { value: "90", label: "1 h 30" },
];

/** Preparation screen: subject (optional), duration (free or countdown) and sharing. */
export function StartSessionForm({ subjects }: { subjects: SubjectRef[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle séance</CardTitle>
        <CardDescription>Choisis la durée et lance le chrono. 1 minute = 1 XP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const planned = String(form.get("plannedMinutes") ?? "");
            const subjectId = String(form.get("subjectId") ?? "");
            startTransition(async () => {
              const res = await startSession({
                mode: planned ? "countdown" : "free",
                plannedMinutes: planned ? Number(planned) : undefined,
                visibility: form.get("share") === "on" ? "friends" : "private",
                subjectId: subjectId || undefined,
              });
              setError(res.ok ? null : res.error.message);
              // The server action does not revalidate the page: show the running session.
              if (res.ok) router.refresh();
            });
          }}
        >
          {subjects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subjectId">Matière</Label>
              <NativeSelect id="subjectId" name="subjectId" className="w-full" defaultValue="">
                <option value="">Aucune matière</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                Ta matière reste privée : tes amis ne la voient que si tu l&apos;autorises dans tes réglages.
              </p>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Durée</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DURATIONS.map((d, i) => (
                <label
                  key={d.value}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                >
                  <input
                    type="radio"
                    name="plannedMinutes"
                    value={d.value}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="share" defaultChecked className="mt-0.5 size-4 accent-primary" />
            <span>
              Partager avec mes amis
              <span className="block text-xs text-muted-foreground">
                Ils te verront « en révision » puis la séance apparaîtra dans leur fil. Jamais tes notes.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            <Play aria-hidden />
            {pending ? "Démarrage…" : "Démarrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
