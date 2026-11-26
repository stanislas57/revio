"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DEFAULT_LOCALE, type Locale } from "../domain/locale";
import { GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, timezoneChoices, type UserSettings } from "../domain/settings";
import { SETTINGS_MESSAGES } from "../domain/settings-messages";
import { updateSettings } from "../server/settings-actions";

type Props = {
  settings: UserSettings;
  /** Language of the screen; French by default. */
  locale?: Locale;
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
      className="mx-auto flex min-h-11 max-w-md cursor-pointer items-start justify-center gap-3 rounded-md py-1 text-center text-sm has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
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

export function SettingsForm({ settings, locale = DEFAULT_LOCALE, onSave = updateSettings }: Props) {
  const m = SETTINGS_MESSAGES[locale];
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const zones = timezoneChoices(settings.timezone, locale);

  return (
    <form
      lang={locale}
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
            showLiveStatus: form.get("showLiveStatus") === "on",
            shareSessionsByDefault: form.get("shareSessionsByDefault") === "on",
          });
          setMessage(res.ok ? { ok: true, text: m.saved } : { ok: false, text: res.error.message });
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="timezone">{m.timezone}</Label>
        <NativeSelect
          id="timezone"
          name="timezone"
          defaultValue={settings.timezone}
          className="h-11 w-full sm:max-w-sm"
        >
          {zones.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label}
            </option>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted-foreground">{m.timezoneHelp}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyGoalMinutes">{m.goal}</Label>
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
          {m.goalHelp(GOAL_MIN_MINUTES, GOAL_MAX_MINUTES)}
        </p>
      </div>

      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-medium">{m.sharingLegend}</legend>
        <Toggle
          id="autoPost"
          name="autoPost"
          defaultChecked={settings.autoPost}
          title={m.autoPostTitle}
          help={m.autoPostHelp}
        />
        <Toggle
          id="shareSubjectInFeed"
          name="shareSubjectInFeed"
          defaultChecked={settings.shareSubjectInFeed}
          title={m.shareSubjectTitle}
          help={m.shareSubjectHelp}
        />
        <Toggle
          id="shareSessionsByDefault"
          name="shareSessionsByDefault"
          defaultChecked={settings.shareSessionsByDefault}
          title={m.shareByDefaultTitle}
          help={m.shareByDefaultHelp}
        />
        <Toggle
          id="showLiveStatus"
          name="showLiveStatus"
          defaultChecked={settings.showLiveStatus}
          title={m.liveStatusTitle}
          help={m.liveStatusHelp}
        />
      </fieldset>

      <div aria-live="polite" className="min-h-5 text-sm">
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? undefined : "text-destructive"}>
            {message.text}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="min-h-11 w-full sm:w-auto">
        {pending ? m.saving : m.save}
      </Button>
      <p className="text-xs text-muted-foreground">{m.appliesNext}</p>
    </form>
  );
}
