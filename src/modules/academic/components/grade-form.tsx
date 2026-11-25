"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { GRADE_KINDS, GRADE_KIND_LABELS, type Grade } from "../domain/types";
import { formatCoefficient, parseDecimal } from "../domain/format";
import { addGrade, updateGrade } from "../server/actions";
import { Field, FormMessage } from "./fields";

/** Adds a grade to `subjectId`, or edits `grade` when given. */
export function GradeForm({
  subjectId,
  grade,
  onDone,
}: {
  subjectId: string;
  grade?: Grade;
  onDone?: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const value = parseDecimal(String(f.get("value") ?? ""));
        const maxValue = parseDecimal(String(f.get("maxValue") ?? ""));
        const coefficient = parseDecimal(String(f.get("coefficient") ?? ""));
        if (Number.isNaN(value)) return setErrors({ value: "Note invalide (ex. 14 ou 14,5)." });
        if (Number.isNaN(maxValue)) return setErrors({ maxValue: "Barème invalide." });
        if (Number.isNaN(coefficient)) return setErrors({ coefficient: "Coefficient invalide." });
        const date = String(f.get("gradedOn") ?? "");
        const input = {
          subjectId,
          label: String(f.get("label") ?? ""),
          value,
          maxValue,
          coefficient,
          gradedOn: date === "" ? null : date,
          kind: String(f.get("kind") ?? "other") as Grade["kind"],
        };
        start(async () => {
          const res = grade ? await updateGrade(grade.id, input) : await addGrade(input);
          if (res.ok) {
            setErrors({});
            setMessage(null);
            if (!grade) form.reset();
            onDone?.();
          } else {
            setErrors(res.error.fields ?? {});
            setMessage(res.error.fields ? null : res.error.message);
          }
        });
      }}
    >
      <Field
        id="value"
        label="Note"
        defaultValue={grade ? formatCoefficient(grade.value) : ""}
        inputMode="decimal"
        required
        error={errors.value}
      />
      <Field
        id="maxValue"
        label="Sur"
        defaultValue={grade ? formatCoefficient(grade.maxValue) : "20"}
        inputMode="decimal"
        error={errors.maxValue}
      />
      <Field
        id="coefficient"
        label="Coefficient"
        defaultValue={grade ? formatCoefficient(grade.coefficient) : "1"}
        inputMode="decimal"
        error={errors.coefficient}
      />
      <Field
        id="label"
        label="Intitulé (facultatif)"
        defaultValue={grade?.label ?? ""}
        maxLength={120}
        error={errors.label}
      />
      <div className="space-y-1.5">
        <Label htmlFor="kind">Type</Label>
        <NativeSelect id="kind" name="kind" defaultValue={grade?.kind ?? "continuous"} className="w-full">
          {GRADE_KINDS.map((k) => (
            <option key={k} value={k}>
              {GRADE_KIND_LABELS[k]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Field
        id="gradedOn"
        label="Date (facultatif)"
        type="date"
        defaultValue={grade?.gradedOn ?? ""}
        error={errors.gradedOn}
      />
      <div className="flex items-center gap-2 sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : grade ? "Enregistrer" : "Ajouter la note"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Annuler
          </Button>
        )}
        <FormMessage text={message} />
      </div>
    </form>
  );
}
