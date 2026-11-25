"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { LOCALES, LOCALE_NAMES, type Locale } from "../domain/locale";
import { SETTINGS_MESSAGES } from "../domain/settings-messages";
import { setLocale } from "../server/locale-actions";

/**
 * Language choice. The label is written in the three languages so it can be found whatever the
 * current one is, and each option is written in its own language. It applies at once.
 */
export function LanguageSelector({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <Label htmlFor="locale">
        <span lang="fr">Langue</span>
        <span aria-hidden> / </span>
        <span lang="en">Language</span>
        <span aria-hidden> / </span>
        <span lang="es">Idioma</span>
      </Label>
      <NativeSelect
        id="locale"
        value={locale}
        disabled={pending}
        className="h-11 w-full sm:max-w-xs"
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            const res = await setLocale(next);
            if (!res.ok) toast.error(res.error.message);
            else router.refresh();
          });
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </NativeSelect>
      <p className="text-sm text-muted-foreground">{SETTINGS_MESSAGES[locale].languageNote}</p>
    </div>
  );
}
