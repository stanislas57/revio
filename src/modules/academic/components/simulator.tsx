"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatAverage, formatCoefficient, parseDecimal } from "../domain/format";
import { requiredGrade, type SimulationScope } from "../domain/simulator";
import type { Subject } from "../domain/types";
import { Field } from "./fields";

/** "Quelle note me faut-il ?" — hypothesis only, nothing is saved. */
export function Simulator({
  subjects,
  defaultTarget,
}: {
  subjects: Subject[];
  defaultTarget: number | null;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [scope, setScope] = useState<SimulationScope>("overall");
  const [raw, setRaw] = useState({
    target: defaultTarget === null ? "10" : formatAverage(defaultTarget),
    coef: "1",
    max: "20",
  });

  const outcome = useMemo(() => {
    const target = parseDecimal(raw.target);
    const coefficient = parseDecimal(raw.coef);
    const maxValue = parseDecimal(raw.max);
    if ([target, coefficient, maxValue].some(Number.isNaN))
      return { error: "Renseigne des nombres valides." } as const;
    if (target < 0 || target > 20) return { error: "L'objectif doit être entre 0 et 20." } as const;
    if (coefficient < 0 || maxValue <= 0) return { error: "Coefficient ≥ 0 et barème > 0." } as const;
    if (!subjects.some((s) => s.id === subjectId)) return { error: "Choisis une matière." } as const;
    const inputs = subjects.map((s) => ({ id: s.id, coefficient: s.coefficient, grades: s.grades }));
    return {
      result: requiredGrade(inputs, { subjectId, coefficient, maxValue }, target, scope),
      maxValue,
      target,
    } as const;
  }, [raw, scope, subjectId, subjects]);

  const set = (key: keyof typeof raw) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRaw({ ...raw, [key]: e.target.value });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulateur</CardTitle>
        <CardDescription>
          Quelle note viser à la prochaine évaluation ? C&apos;est une hypothèse : rien n&apos;est enregistré.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sim-subject">Matière de la prochaine note</Label>
            <NativeSelect
              id="sim-subject"
              className="w-full"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sim-scope">Objectif porté sur</Label>
            <NativeSelect
              id="sim-scope"
              className="w-full"
              value={scope}
              onChange={(e) => setScope(e.target.value as SimulationScope)}
            >
              <option value="overall">La moyenne générale</option>
              <option value="subject">La moyenne de la matière</option>
            </NativeSelect>
          </div>
          <Field
            id="sim-target"
            label="Objectif (/20)"
            value={raw.target}
            onChange={set("target")}
            inputMode="decimal"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="sim-coef"
              label="Coefficient de la note"
              value={raw.coef}
              onChange={set("coef")}
              inputMode="decimal"
            />
            <Field id="sim-max" label="Barème" value={raw.max} onChange={set("max")} inputMode="decimal" />
          </div>
        </div>
        <div role="status" className="rounded-md bg-muted p-3 text-sm">
          {"error" in outcome ? (
            <p className="text-muted-foreground">{outcome.error}</p>
          ) : outcome.result.status === "reachable" ? (
            <p>
              Il te faut au moins{" "}
              <strong>
                {formatCoefficient(outcome.result.requiredValue)}/{formatCoefficient(outcome.maxValue)}
              </strong>{" "}
              pour atteindre {formatAverage(outcome.target)} de moyenne.
            </p>
          ) : outcome.result.status === "guaranteed" ? (
            <p>
              Objectif déjà garanti : même avec 0, la moyenne resterait à{" "}
              {formatAverage(outcome.result.worst)}.
            </p>
          ) : outcome.result.status === "impossible" ? (
            <p>
              Impossible avec cette seule note : le maximum donnerait {formatAverage(outcome.result.best)}. Il
              faudra plusieurs évaluations.
            </p>
          ) : (
            <p>Cette note n&apos;aurait aucun effet sur la moyenne (coefficient nul).</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Calcul selon la convention Revio (moyenne pondérée), pas une règle officielle de ton établissement :
          arrondis, compensation et notes éliminatoires ne sont pas pris en compte.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRaw({ target: "10", coef: "1", max: "20" })}
        >
          Réinitialiser
        </Button>
      </CardContent>
    </Card>
  );
}
