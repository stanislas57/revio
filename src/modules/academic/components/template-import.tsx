"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BUT_GEA_S1 } from "../domain/templates";
import { importTemplate } from "../server/actions";
import { FormMessage } from "./fields";

export function TemplateImport() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2 rounded-lg border p-4 text-sm">
      <p className="font-medium">Partir d&apos;un exemple</p>
      <p className="text-muted-foreground">{BUT_GEA_S1.disclaimer}</p>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await importTemplate(BUT_GEA_S1.key);
            setError(res.ok ? null : res.error.message);
          })
        }
      >
        {pending ? "Import…" : BUT_GEA_S1.label}
      </Button>
      <FormMessage text={error} />
    </div>
  );
}
