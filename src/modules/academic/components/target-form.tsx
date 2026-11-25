"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatAverage, parseDecimal } from "../domain/format";
import { setTargetAverage } from "../server/actions";
import { Field, FormMessage } from "./fields";

export function TargetForm({ target }: { target: number | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const raw = String(new FormData(e.currentTarget).get("target") ?? "").trim();
        const value = raw === "" ? null : parseDecimal(raw);
        if (value !== null && Number.isNaN(value)) return setError("Nombre invalide (ex. 12 ou 12,5).");
        start(async () => {
          const res = await setTargetAverage(value);
          setError(res.ok ? null : res.error.message);
        });
      }}
    >
      <div className="w-40">
        <Field
          id="target"
          label="Objectif de moyenne (/20)"
          defaultValue={target === null ? "" : formatAverage(target)}
          inputMode="decimal"
          placeholder="10"
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "…" : "Enregistrer"}
      </Button>
      <FormMessage text={error} />
    </form>
  );
}
