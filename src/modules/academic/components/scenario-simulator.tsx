"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatAverage, parseDecimal } from "../domain/format";
import { MAX_HYPOTHESES, projectScenario, type Hypothesis } from "../domain/scenario";
import type { Subject } from "../domain/types";
import type { ScenarioInput } from "../schemas";
import type { SavedScenario } from "../server/scenarios";
import { Field } from "./fields";

type Row = { key: number; subjectId: string; value: string; max: string; coef: string };

/** "Et si j'avais ces notes ?" — several hypothetical grades; saved scenarios are private. */
export function ScenarioSimulator({
  subjects,
  saved,
  onSave,
  onDelete,
}: {
  subjects: Subject[];
  saved: SavedScenario[];
  onSave: (input: ScenarioInput) => Promise<ActionResult<{ id: string }>>;
  onDelete: (id: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const [nextKey, setNextKey] = useState(2);
  const [rows, setRows] = useState<Row[]>([
    { key: 1, subjectId: subjects[0]?.id ?? "", value: "", max: "20", coef: "1" },
  ]);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => {
    const hypotheses: Hypothesis[] = [];
    let incomplete = 0;
    for (const r of rows) {
      const value = parseDecimal(r.value);
      const maxValue = parseDecimal(r.max);
      const coefficient = parseDecimal(r.coef);
      const valid =
        r.subjectId &&
        [value, maxValue, coefficient].every((n) => !Number.isNaN(n)) &&
        value >= 0 &&
        maxValue > 0 &&
        value <= maxValue &&
        coefficient >= 0;
      if (valid) hypotheses.push({ subjectId: r.subjectId, value, maxValue, coefficient });
      else incomplete++;
    }
    return { hypotheses, incomplete };
  }, [rows]);

  const projection = useMemo(() => {
    if (parsed.hypotheses.length === 0) return null;
    const inputs = subjects.map((s) => ({ id: s.id, coefficient: s.coefficient, grades: s.grades }));
    return projectScenario(inputs, parsed.hypotheses);
  }, [parsed.hypotheses, subjects]);

  const names = new Map(subjects.map((s) => [s.id, s.name]));
  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const load = (s: SavedScenario) => {
    const known = s.hypotheses.filter((h) => names.has(h.subjectId));
    if (known.length === 0) {
      toast.error("Les matières de ce scénario n'existent plus.");
      return;
    }
    setRows(
      known.map((h, i) => ({
        key: i + 1,
        subjectId: h.subjectId,
        value: String(h.value).replace(".", ","),
        max: String(h.maxValue).replace(".", ","),
        coef: String(h.coefficient).replace(".", ","),
      })),
    );
    setNextKey(known.length + 1);
    setName(s.name);
    if (known.length < s.hypotheses.length) toast.message("Certaines matières n'existent plus : ignorées.");
  };

  const save = () =>
    startTransition(async () => {
      const res = await onSave({ name, hypotheses: parsed.hypotheses });
      if (!res.ok) toast.error(res.error.message);
      else {
        toast.success("Scénario enregistré.");
        setName("");
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scénarios</CardTitle>
        <CardDescription>
          Et si tu avais plusieurs notes ? Ce sont des hypothèses : tes vraies notes ne changent pas. Un
          scénario enregistré reste privé.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`sc-subject-${r.key}`}>Matière (note {i + 1})</Label>
                <NativeSelect
                  id={`sc-subject-${r.key}`}
                  className="w-full"
                  value={r.subjectId}
                  onChange={(e) => update(r.key, { subjectId: e.target.value })}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Field
                id={`sc-value-${r.key}`}
                label="Note"
                value={r.value}
                inputMode="decimal"
                onChange={(e) => update(r.key, { value: e.target.value })}
              />
              <Field
                id={`sc-max-${r.key}`}
                label="Barème"
                value={r.max}
                inputMode="decimal"
                onChange={(e) => update(r.key, { max: e.target.value })}
              />
              <Field
                id={`sc-coef-${r.key}`}
                label="Coef."
                value={r.coef}
                inputMode="decimal"
                onChange={(e) => update(r.key, { coef: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                className="min-h-11"
                aria-label={`Retirer la note ${i + 1}`}
                disabled={rows.length === 1}
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={rows.length >= MAX_HYPOTHESES}
          onClick={() => {
            setRows((rs) => [
              ...rs,
              { key: nextKey, subjectId: subjects[0]?.id ?? "", value: "", max: "20", coef: "1" },
            ]);
            setNextKey(nextKey + 1);
          }}
        >
          <Plus aria-hidden /> Ajouter une note
        </Button>

        <div role="status" className="rounded-md bg-muted p-3 text-sm">
          {projection === null ? (
            <p className="text-muted-foreground">Renseigne au moins une note valide pour voir le résultat.</p>
          ) : (
            <div className="space-y-2">
              <p>
                Moyenne générale :{" "}
                <strong>
                  {projection.overallBefore === null ? "—" : formatAverage(projection.overallBefore)} →{" "}
                  {projection.overallAfter === null ? "—" : formatAverage(projection.overallAfter)}
                </strong>
              </p>
              <ul className="space-y-0.5">
                {projection.subjects.map((s) => (
                  <li key={s.subjectId}>
                    {names.get(s.subjectId)} : {s.before === null ? "—" : formatAverage(s.before)} →{" "}
                    {s.after === null ? "—" : formatAverage(s.after)}
                  </li>
                ))}
              </ul>
              {parsed.incomplete > 0 && (
                <p className="text-xs text-muted-foreground">
                  {parsed.incomplete} ligne{parsed.incomplete > 1 ? "s" : ""} incomplète
                  {parsed.incomplete > 1 ? "s" : ""} ignorée{parsed.incomplete > 1 ? "s" : ""}.
                </p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Calcul selon la convention Revio (moyenne pondérée), pas une règle officielle de ton établissement.
        </p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Field
              id="sc-name"
              label="Nom du scénario"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="min-h-11"
            disabled={pending || name.trim() === "" || parsed.hypotheses.length === 0}
            onClick={save}
          >
            Enregistrer ce scénario
          </Button>
        </div>

        {saved.length > 0 && (
          <section aria-labelledby="sc-saved" className="space-y-2">
            <h3 id="sc-saved" className="text-sm font-semibold">
              Mes scénarios ({saved.length}/20)
            </h3>
            <ul className="space-y-2">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center gap-2 rounded-lg border px-3 py-1">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {s.name} · {s.hypotheses.length} note{s.hypotheses.length > 1 ? "s" : ""}
                  </span>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => load(s)}>
                    Charger
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11"
                    aria-label={`Supprimer le scénario ${s.name}`}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await onDelete(s.id);
                        if (!res.ok) toast.error(res.error.message);
                      })
                    }
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
