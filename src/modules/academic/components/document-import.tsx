"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ParsedSubject } from "../domain/document-parser";
import { analyzeDocument, importSubjects } from "../server/import-actions";
import { FormMessage } from "./fields";

type Row = {
  key: number;
  include: boolean;
  name: string;
  coefficient: string;
  semester: string | null;
  grades: { value: string; maxValue: string }[];
  notes: string[];
};

const toText = (n: number) => String(n).replace(".", ",");
const toNumber = (s: string) => Number(s.trim().replace(",", "."));

function toRows(subjects: ParsedSubject[]): Row[] {
  return subjects.map((s, key) => ({
    key,
    include: true,
    name: s.name,
    coefficient: s.coefficient === null ? "1" : toText(s.coefficient),
    semester: s.semester,
    grades: s.grades.map((g) => ({ value: toText(g.value), maxValue: toText(g.maxValue) })),
    notes: s.coefficient === null ? [...s.notes, "Coefficient absent du document : 1 par défaut."] : s.notes,
  }));
}

/**
 * Import of a transcript or a subjects-and-coefficients sheet. Step 1: Revio reads the document (in memory,
 * nothing is kept). Step 2: the user checks and corrects every line. Step 3: only then are subjects and
 * grades saved.
 */
export function DocumentImport() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();

  function patch(key: number, change: Partial<Row>) {
    setRows((all) => all?.map((r) => (r.key === key ? { ...r, ...change } : r)) ?? null);
  }

  function save() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.include);
    const payload = chosen.map((r) => ({
      name: r.name,
      coefficient: toNumber(r.coefficient),
      semester: r.semester,
      grades: r.grades.map((g) => ({ value: toNumber(g.value), maxValue: toNumber(g.maxValue) })),
    }));
    if (
      payload.some(
        (s) =>
          Number.isNaN(s.coefficient) ||
          s.grades.some((g) => Number.isNaN(g.value) || Number.isNaN(g.maxValue)),
      )
    ) {
      setError("Un coefficient ou une note n'est pas un nombre. Corrige les lignes concernées.");
      return;
    }
    startSave(async () => {
      const res = await importSubjects({ subjects: payload });
      if (res.ok) {
        setError(null);
        setRows(null);
        setDone(
          `${res.data.subjects} matière${res.data.subjects > 1 ? "s" : ""} et ${res.data.grades} note${res.data.grades > 1 ? "s" : ""} ajoutées.`,
        );
      } else {
        setError(res.error.message);
      }
    });
  }

  return (
    <Card id="importer" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" aria-hidden /> Importer un relevé ou une fiche de matières
        </CardTitle>
        <CardDescription>
          Dépose un relevé de notes, un bulletin ou ta fiche de matières et coefficients (PDF avec du texte,
          CSV ou fichier texte). Revio le lit sur le serveur sans l&apos;enregistrer, puis te propose des
          matières que tu vérifies avant tout ajout. La lecture est automatique et peut se tromper.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows === null ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setDone(null);
              setError(null);
              startAnalyze(async () => {
                const res = await analyzeDocument(form);
                if (!res.ok) return setError(res.error.message);
                setWarnings(res.data.warnings);
                if (res.data.subjects.length === 0) {
                  setError(res.data.warnings[0] ?? "Aucune matière trouvée.");
                  return;
                }
                setRows(toRows(res.data.subjects));
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="import-file">Document (4 Mo maximum)</Label>
              <Input
                id="import-file"
                name="file"
                type="file"
                accept=".pdf,.csv,.txt,text/*,application/pdf"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-text">Ou colle le texte du document</Label>
              <textarea
                id="import-text"
                name="text"
                rows={4}
                maxLength={200000}
                placeholder={"Mathématiques coef 4 14,5\nAnglais coef 2 12"}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <Button type="submit" className="h-11" disabled={analyzing}>
              {analyzing ? "Lecture…" : "Analyser le document"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">Vérifie les {rows.length} lignes proposées, puis importe.</p>
            {warnings.map((w) => (
              <p key={w} className="text-sm text-muted-foreground">
                {w}
              </p>
            ))}
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.key} className="space-y-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => patch(r.key, { include: e.target.checked })}
                        className="size-5 accent-primary"
                        aria-label={`Importer ${r.name}`}
                      />
                    </label>
                    <div className="min-w-48 flex-1 space-y-1">
                      <Label htmlFor={`name-${r.key}`}>Matière</Label>
                      <Input
                        id={`name-${r.key}`}
                        value={r.name}
                        maxLength={80}
                        className="h-11"
                        onChange={(e) => patch(r.key, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label htmlFor={`coef-${r.key}`}>Coef.</Label>
                      <Input
                        id={`coef-${r.key}`}
                        value={r.coefficient}
                        inputMode="decimal"
                        className="h-11"
                        onChange={(e) => patch(r.key, { coefficient: e.target.value })}
                      />
                    </div>
                    {r.grades.map((g, i) => (
                      <div key={i} className="flex items-end gap-1">
                        <div className="w-24 space-y-1">
                          <Label htmlFor={`grade-${r.key}-${i}`}>Note</Label>
                          <Input
                            id={`grade-${r.key}-${i}`}
                            value={g.value}
                            inputMode="decimal"
                            className="h-11"
                            onChange={(e) =>
                              patch(r.key, {
                                grades: r.grades.map((x, j) =>
                                  j === i ? { ...x, value: e.target.value } : x,
                                ),
                              })
                            }
                          />
                        </div>
                        <span className="pb-3 text-sm">/</span>
                        <div className="w-20 space-y-1">
                          <Label htmlFor={`max-${r.key}-${i}`}>Barème</Label>
                          <Input
                            id={`max-${r.key}-${i}`}
                            value={g.maxValue}
                            inputMode="decimal"
                            className="h-11"
                            onChange={(e) =>
                              patch(r.key, {
                                grades: r.grades.map((x, j) =>
                                  j === i ? { ...x, maxValue: e.target.value } : x,
                                ),
                              })
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11"
                          aria-label={`Retirer la note ${i + 1} de ${r.name}`}
                          onClick={() => patch(r.key, { grades: r.grades.filter((_, j) => j !== i) })}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  {r.notes.map((n) => (
                    <p key={n} className="text-xs text-muted-foreground">
                      À vérifier : {n}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="h-11"
                disabled={saving || rows.every((r) => !r.include)}
                onClick={save}
              >
                {saving ? "Import…" : "Importer les lignes cochées"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                disabled={saving}
                onClick={() => setRows(null)}
              >
                Annuler
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Une matière que tu as déjà n&apos;est pas dupliquée : seules ses notes sont ajoutées.
            </p>
          </div>
        )}
        <FormMessage text={error} />
        {done && (
          <p role="status" className="text-sm">
            {done}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
