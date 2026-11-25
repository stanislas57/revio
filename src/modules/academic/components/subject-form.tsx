"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Subject } from "../domain/types";
import { formatAverage, formatCoefficient, parseDecimal } from "../domain/format";
import { addSubject, updateSubject } from "../server/actions";
import { Field, FormMessage } from "./fields";

function num(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  return s === "" ? null : parseDecimal(s);
}

/** Creates a subject, or edits `subject` when given. */
export function SubjectForm({ subject, onDone }: { subject?: Subject; onDone?: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      key={subject?.id ?? "new"}
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const coefficient = num(f.get("coefficient"));
        const target = num(f.get("targetAverage"));
        if (coefficient === null || Number.isNaN(coefficient))
          return setErrors({ coefficient: "Coefficient invalide." });
        if (target !== null && Number.isNaN(target)) return setErrors({ targetAverage: "Nombre invalide." });
        const input = {
          name: String(f.get("name") ?? ""),
          coefficient,
          teachingUnit: String(f.get("teachingUnit") ?? ""),
          semester: String(f.get("semester") ?? ""),
          targetAverage: target,
        };
        start(async () => {
          const res = subject ? await updateSubject(subject.id, input) : await addSubject(input);
          if (res.ok) {
            setErrors({});
            setMessage(null);
            if (!subject) form.reset();
            onDone?.();
          } else {
            setErrors(res.error.fields ?? {});
            setMessage(res.error.fields ? null : res.error.message);
          }
        });
      }}
    >
      <Field
        id="name"
        label="Matière"
        defaultValue={subject?.name ?? ""}
        maxLength={80}
        required
        error={errors.name}
      />
      <Field
        id="coefficient"
        label="Coefficient"
        defaultValue={subject ? formatCoefficient(subject.coefficient) : "1"}
        inputMode="decimal"
        hint="0 = affichée mais sans effet sur la moyenne."
        error={errors.coefficient}
      />
      <Field
        id="teachingUnit"
        label="UE (facultatif)"
        defaultValue={subject?.teachingUnit ?? ""}
        maxLength={80}
        error={errors.teachingUnit}
      />
      <Field
        id="semester"
        label="Semestre (facultatif)"
        defaultValue={subject?.semester ?? ""}
        maxLength={40}
        placeholder="S1"
        error={errors.semester}
      />
      <Field
        id="targetAverage"
        label="Objectif de la matière (facultatif)"
        defaultValue={subject?.targetAverage != null ? formatAverage(subject.targetAverage) : ""}
        inputMode="decimal"
        error={errors.targetAverage}
      />
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : subject ? "Enregistrer" : "Ajouter la matière"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Annuler
          </Button>
        )}
      </div>
      <div className="sm:col-span-2">
        <FormMessage text={message} />
      </div>
    </form>
  );
}
