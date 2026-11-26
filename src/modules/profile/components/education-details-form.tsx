"use client";

import { useState, useTransition } from "react";
import { ChoiceGrid } from "@/components/revio/choice-grid";
import { Button } from "@/components/ui/button";
import {
  GENDER_LABELS,
  GENDERS,
  STUDY_LEVEL_LABELS,
  STUDY_LEVELS,
  type Gender,
  type StudyLevel,
} from "../domain/education";
import { saveEducationDetails } from "../server/education-actions";

/** "Mes informations": the study level and the (optional) gender, editable and erasable, seen by the user only. */
export function EducationDetailsForm({
  studyLevel: initialLevel,
  gender: initialGender,
}: {
  studyLevel: StudyLevel | null;
  gender: Gender | null;
}) {
  const [studyLevel, setStudyLevel] = useState(initialLevel);
  const [gender, setGender] = useState(initialGender);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const unchanged = studyLevel === initialLevel && gender === initialGender;

  function save(next: { studyLevel: StudyLevel | null; gender: Gender | null }, text: string) {
    setMessage(null);
    start(async () => {
      const res = await saveEducationDetails(next);
      setMessage(res.ok ? { ok: true, text } : { ok: false, text: res.error.message });
    });
  }

  return (
    <div className="space-y-8">
      <ChoiceGrid
        label="Niveau d'études"
        columns={4}
        value={studyLevel}
        onChange={setStudyLevel}
        choices={STUDY_LEVELS.map((v) => ({ value: v, ...STUDY_LEVEL_LABELS[v] }))}
      />
      <ChoiceGrid
        label="Sexe (facultatif)"
        description="Visible par toi seul. Tu peux effacer ta réponse à tout moment."
        value={gender}
        onChange={setGender}
        choices={GENDERS.map((v) => ({ value: v, label: GENDER_LABELS[v] }))}
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          className="h-11"
          disabled={pending || unchanged}
          onClick={() => save({ studyLevel, gender }, "Informations enregistrées.")}
        >
          {pending ? "Enregistrement…" : "Enregistrer mes informations"}
        </Button>
        {initialGender !== null && (
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={pending}
            onClick={() => {
              setGender(null);
              save({ studyLevel, gender: null }, "Réponse sur le sexe effacée.");
            }}
          >
            Effacer ma réponse sur le sexe
          </Button>
        )}
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "text-sm" : "text-sm text-destructive"}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
