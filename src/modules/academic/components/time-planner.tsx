"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatMinutes } from "@/modules/focus/domain/format";
import type { Priority } from "../domain/priority";
import { parseDecimal } from "../domain/format";
import {
  ALLOCATION_MODES,
  MAX_BUDGET_MINUTES,
  allocateStudyTime,
  type AllocationMode,
} from "../domain/time-allocation";
import type { Subject } from "../domain/types";
import { Field } from "./fields";

/** "Comment répartir mon temps ?" — a suggestion from a stated assumption, nothing is saved. */
export function TimePlanner({ subjects, priorities }: { subjects: Subject[]; priorities: Priority[] }) {
  const [hours, setHours] = useState("6");
  const [mode, setMode] = useState<AllocationMode>("priorities");

  const result = useMemo(() => {
    const h = parseDecimal(hours);
    if (Number.isNaN(h) || h < 0 || h * 60 > MAX_BUDGET_MINUTES) return null;
    const byId = new Map(priorities.map((p) => [p.id, p]));
    const inputs = subjects.flatMap((s) => {
      const p = byId.get(s.id);
      return p
        ? [
            {
              id: s.id,
              name: s.name,
              coefficient: s.coefficient,
              score: p.score,
              pointValue: p.pointValue,
              needsAttention: p.needsAttention,
            },
          ]
        : [];
    });
    return allocateStudyTime(inputs, Math.round(h * 60), mode).filter((a) => a.minutes > 0);
  }, [hours, mode, subjects, priorities]);

  const help = ALLOCATION_MODES.find((m) => m.id === mode)?.help;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartir mon temps</CardTitle>
        <CardDescription>
          Où mettre tes heures de révision ? C&apos;est une suggestion, pas une prévision : rien n&apos;est
          enregistré.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            id="tp-hours"
            label="Heures disponibles"
            value={hours}
            inputMode="decimal"
            onChange={(e) => setHours(e.target.value)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="tp-mode">Mode</Label>
            <NativeSelect
              id="tp-mode"
              className="w-full"
              value={mode}
              onChange={(e) => setMode(e.target.value as AllocationMode)}
            >
              {ALLOCATION_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{help}</p>
        <div role="status" className="rounded-md bg-muted p-3 text-sm">
          {result === null ? (
            <p className="text-muted-foreground">
              Renseigne un nombre d&apos;heures valide (100 h au maximum).
            </p>
          ) : result.length === 0 ? (
            <p className="text-muted-foreground">Rien à répartir avec ce temps.</p>
          ) : (
            <ul className="space-y-0.5">
              {result.map((a) => (
                <li key={a.id}>
                  {a.name} : <strong>{formatMinutes(a.minutes)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Revio ne sait pas combien de points une heure de travail te fait gagner : cette répartition indique
          où regarder en premier, selon la convention Revio (priorités, coefficients), pas ce que tu
          obtiendras.
        </p>
      </CardContent>
    </Card>
  );
}
