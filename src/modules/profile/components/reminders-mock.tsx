"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { MockBadge, NotImplemented } from "@/components/states/not-implemented";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_REMINDER, describeReminder, REMINDER_DAYS } from "../domain/reminders";

/**
 * Mock-up of the "Rappels" settings. Nothing is saved or sent: the values live in this component only
 * and go back to the defaults on reload. It never asks for a notification permission.
 */
export function RemindersMock() {
  const [time, setTime] = useState<string>(DEFAULT_REMINDER.time);
  const [days, setDays] = useState<number[]>(DEFAULT_REMINDER.days);
  const toggle = (id: number) =>
    setDays((current) => (current.includes(id) ? current.filter((d) => d !== id) : [...current, id]));

  return (
    <Card id="rappels" className="scroll-mt-20">
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="flex flex-wrap items-center gap-2">
          <Bell className="size-5" aria-hidden /> Rappels <MockBadge />
        </CardTitle>
        <CardDescription>
          Un rappel quotidien pour garder ta série. Maquette : tu peux essayer l&apos;écran, mais rien
          n&apos;est enregistré et aucune notification n&apos;est envoyée.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <NotImplemented
          owner="Stan"
          feature="Les rappels n'existent pas encore côté serveur : aucune permission de notification n'est demandée et aucune valeur n'est conservée."
        />
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Heure du rappel</Label>
          <Input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 w-36"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Jours actifs</legend>
          <div className="flex flex-wrap gap-2">
            {REMINDER_DAYS.map((d) => (
              <label
                key={d.id}
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border px-3 text-sm has-checked:border-brand has-checked:bg-brand-soft has-checked:font-medium has-checked:text-brand-soft-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={days.includes(d.id)}
                  onChange={() => toggle(d.id)}
                  aria-label={d.long}
                />
                <span aria-hidden>{d.short}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p role="status" aria-live="polite" className="text-sm">
          {describeReminder(time, days)}
        </p>
        <Button type="button" disabled className="min-h-11">
          Enregistrer les rappels
        </Button>
        <p className="text-xs text-muted-foreground">
          Bouton désactivé : l&apos;enregistrement viendra avec le serveur.
        </p>
      </CardContent>
    </Card>
  );
}
