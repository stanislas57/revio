"use client";

import { useActionState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLANNED_MINUTES_OPTIONS } from "../schemas";
import { startSession } from "../server/actions";

const MODES = [
  { value: "", label: "Chrono libre" },
  ...PLANNED_MINUTES_OPTIONS.map((m) => ({
    value: String(m),
    label: m === 25 ? "25 min (Pomodoro)" : `${m} min`,
  })),
];

export function StartSessionForm() {
  const [state, action, pending] = useActionState(startSession, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle séance</CardTitle>
        <CardDescription>Choisis ce que tu révises et lance le chrono. 1 minute = 1 XP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="label">Matière ou sujet</Label>
            <Input id="label" name="label" maxLength={60} placeholder="Ex. Statistiques" autoComplete="off" />
            <p className="text-xs text-muted-foreground">
              Facultatif. Visible par tes amis si tu partages la séance.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Durée</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {MODES.map((m, i) => (
                <label
                  key={m.value}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                >
                  <input
                    type="radio"
                    name="plannedMinutes"
                    value={m.value}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  {m.label}
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

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
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
