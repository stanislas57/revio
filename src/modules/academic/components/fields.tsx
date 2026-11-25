"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Labelled input with an optional field error (shared by the academic forms). */
export function Field({
  id,
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string; error?: string | undefined; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={error ? true : undefined} {...props} />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function FormMessage({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="text-sm text-destructive">
      {text}
    </p>
  ) : null;
}
