"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, timezoneChoices, type UserSettings } from "../domain/settings";
import { updateSettings } from "../server/settings-actions";

type Props = {
  settings: UserSettings;
  /** Replaceable in tests and demos; defaults to the real Server Action. */
  onSave?: typeof updateSettings;
};

function Toggle({
  id,
  name,
  defaultChecked,
  title,
  help,
}: {
  id: string;
  name: string;
  defaultChecked: boolean;
  title: string;
  help: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md py-1 text-sm has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 size-5 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block text-muted-foreground">{help}</span>
      </span>
    </label>
  );
}

export function SettingsForm({ settings, onSave = updateSettings }: Props) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const zones = timezoneChoices(settings.timezone);

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const goalText = String(form.get("dailyGoalMinutes") ?? "").trim();
        // Do not keep showing the previous result while the new save is running.
        setMessage(null);
        startTransition(async () => {
          const res = await onSave({
            timezone: String(form.get("timezone") ?? ""),
            // An empty or non numeric field becomes NaN: the server explains the problem.
            dailyGoalMinutes: goalText === "" ? Number.NaN : Number(goalText),
            autoPost: form.get("autoPost") === "on",
            shareSubjectInFeed: form.get("shareSubjectInFeed") === "on",
          });
          setMessage(
            res.ok ? { ok: true, text: "Réglages enregistrés." } : { ok: false, text: res.error.message },
          );
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="timezone">Fuseau horaire</Label>
        <NativeSelect
          id="timezone"
          name="timezone"
          defaultValue={settings.timezone}
          className="w-full sm:max-w-sm"
        >
          {zones.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted-foreground">
          Tes jours (série, objectif du jour) commencent et finissent à minuit dans ce fuseau.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyGoalMinutes">Objectif du jour (minutes)</Label>
        <Input
          id="dailyGoalMinutes"
          name="dailyGoalMinutes"
          type="number"
          inputMode="numeric"
          min={GOAL_MIN_MINUTES}
          max={GOAL_MAX_MINUTES}
          step={5}
          defaultValue={settings.dailyGoalMinutes}
          aria-describedby="goal-help"
          className="h-11 w-32"
        />
        <p id="goal-help" className="text-sm text-muted-foreground">
          Entre {GOAL_MIN_MINUTES} et {GOAL_MAX_MINUTES} minutes. L&apos;atteindre rapporte un bonus d&apos;XP
          une fois par jour.
        </p>
      </div>

      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-medium">Partage avec tes amis</legend>
        <Toggle
          id="autoPost"
          name="autoPost"
          defaultChecked={settings.autoPost}
          title="Publier mes séances dans le fil"
          help="Quand une séance partagée se termine, elle apparaît dans le fil de tes amis."
        />
        <Toggle
          id="shareSubjectInFeed"
          name="shareSubjectInFeed"
          defaultChecked={settings.shareSubjectInFeed}
          title="Montrer le nom de ma matière"
          help="Désactivé par défaut : tes amis ne voient jamais ta matière sans ton accord. Tes notes ne sont jamais partagées."
        />
      </fieldset>

      <div aria-live="polite" className="min-h-5 text-sm">
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? undefined : "text-destructive"}>
            {message.text}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Enregistrement…" : "Enregistrer les réglages"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Les réglages s&apos;appliquent à ta prochaine séance terminée.
      </p>
    </form>
  );
}
