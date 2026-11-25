"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import type { NotificationPrefs } from "../contracts";

const OPTIONS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "friendRequests", label: "Quand quelqu'un me demande en ami" },
  { key: "friendAccepted", label: "Quand quelqu'un accepte ma demande" },
  { key: "reactions", label: "Quand quelqu'un m'envoie un bravo" },
];

/** Three checkboxes saved on change. The database applies them: a kind switched off is never created. */
export function NotificationPrefsForm({
  initial,
  onSave,
}: {
  initial: NotificationPrefs;
  onSave: (prefs: NotificationPrefs) => Promise<ActionResult<NotificationPrefs>>;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();

  const change = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    startTransition(async () => {
      const res = await onSave(next);
      if (!res.ok) {
        setPrefs(prefs);
        toast.error(res.error.message);
      }
    });
  };

  return (
    <fieldset className="space-y-1 rounded-xl border p-4" disabled={pending}>
      <legend className="px-1 text-sm font-semibold">Me notifier</legend>
      {OPTIONS.map(({ key, label }) => (
        <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-[var(--brand)]"
            checked={prefs[key]}
            onChange={(e) => change(key, e.target.checked)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
