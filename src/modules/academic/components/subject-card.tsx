"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate } from "../domain/dates";
import { formatAverage, formatCoefficient, formatGrade } from "../domain/format";
import { GRADE_KIND_LABELS, type Subject } from "../domain/types";
import { weightedAverage } from "../domain/weighted-average";
import { deleteGrade, deleteSubject, setSubjectArchived } from "../server/actions";
import { FormMessage } from "./fields";
import { GradeForm } from "./grade-form";
import { SubjectForm } from "./subject-form";

export function SubjectCard({ subject }: { subject: Subject }) {
  const [editing, setEditing] = useState(false);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const average = weightedAverage(subject.grades);

  function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    start(async () => {
      const res = await action();
      setError(res.ok ? null : (res.error?.message ?? "Erreur."));
      if (res.ok) setConfirmDelete(false);
    });
  }

  return (
    <Card className={subject.archived ? "opacity-70" : undefined}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 break-words">
            {subject.color && (
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
            )}
            {subject.name}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Badge variant="secondary">Coef. {formatCoefficient(subject.coefficient)}</Badge>
            {subject.teachingUnit && <Badge variant="outline">{subject.teachingUnit}</Badge>}
            {subject.semester && <Badge variant="outline">{subject.semester}</Badge>}
            {subject.targetAverage !== null && (
              <Badge variant="outline">Objectif {formatAverage(subject.targetAverage)}</Badge>
            )}
            {subject.isTemplate && <Badge variant="outline">Exemple à vérifier</Badge>}
            {subject.archived && <Badge variant="outline">Archivée</Badge>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{average === null ? "—" : formatAverage(average)}</p>
          <p className="text-xs text-muted-foreground">
            /20 · {subject.grades.length} note{subject.grades.length > 1 ? "s" : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <SubjectForm subject={subject} onDone={() => setEditing(false)} />
        ) : (
          <>
            {subject.grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune note pour l&apos;instant.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {subject.grades.map((g) =>
                  editingGrade === g.id ? (
                    <li key={g.id} className="p-3">
                      <GradeForm subjectId={subject.id} grade={g} onDone={() => setEditingGrade(null)} />
                    </li>
                  ) : (
                    <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {formatGrade(g.value, g.maxValue)}
                          {g.label ? ` · ${g.label}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {GRADE_KIND_LABELS[g.kind]} · coef. {formatCoefficient(g.coefficient)}
                          {g.gradedOn ? ` · ${formatShortDate(g.gradedOn)}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Modifier la note"
                          onClick={() => setEditingGrade(g.id)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer la note"
                          disabled={pending}
                          onClick={() => run(() => deleteGrade(g.id))}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
            {adding ? (
              <GradeForm subjectId={subject.id} onDone={() => setAdding(false)} />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                Ajouter une note
              </Button>
            )}
          </>
        )}

        {!editing && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Modifier la matière
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => run(() => setSubjectArchived(subject.id, !subject.archived))}
            >
              {subject.archived ? <ArchiveRestore /> : <Archive />}
              {subject.archived ? "Désarchiver" : "Archiver"}
            </Button>
            {confirmDelete ? (
              <>
                <span className="text-sm text-destructive">
                  Supprime aussi ses {subject.grades.length} note(s), définitivement.
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => deleteSubject(subject.id))}
                >
                  Confirmer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Supprimer
              </Button>
            )}
          </div>
        )}
        <FormMessage text={error} />
      </CardContent>
    </Card>
  );
}
