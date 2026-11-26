"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { ChoiceGrid } from "@/components/revio/choice-grid";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { celebrate } from "@/components/revio/confetti";
import { Button } from "@/components/ui/button";
import { addExam } from "@/modules/academic/server/actions";
import { formatShortDate } from "@/modules/academic/domain/dates";
import {
  buildQuickResult,
  DAY_LABELS,
  DURATIONS,
  hourLabel,
  needsSubject,
  needsTime,
  OTHER_SUBJECTS,
  QUICK_TYPE_LABELS,
  QUICK_TYPES,
  quickTitle,
  resolveDay,
  SLOT_HOURS,
  type DayChoice,
  type QuickAnswers,
  type QuickType,
} from "../domain/quick-add";
import { addEvent } from "../server/actions";

type Step = "type" | "subject" | "day" | "time" | "recap";

/** The steps of a type: no subject for a break, no time for an exam. */
function stepsFor(type: QuickType | null): Step[] {
  if (type === null) return ["type"];
  return [
    "type",
    ...(needsSubject(type) ? (["subject"] as const) : []),
    "day",
    ...(needsTime(type) ? (["time"] as const) : []),
    "recap",
  ];
}

const STEP_QUESTION: Record<Step, string> = {
  type: "Qu'ajoutes-tu ?",
  subject: "Pour quelle matière ?",
  day: "Quel jour ?",
  time: "À quelle heure, et combien de temps ?",
  recap: "On ajoute ça ?",
};

const OTHER = "__autre";
const empty: QuickAnswers = {
  type: "revision",
  subject: null,
  other: null,
  day: "today",
  hour: null,
  minutes: null,
};

/**
 * « Ajouter à l'agenda » without typing: a path of big buttons (type, subject, day, time and duration, recap).
 * Each step highlights the choice, "Retour" goes back, and the recap has one big "Ajouter" with a light
 * success animation. The same `addEvent` and `addExam` actions as the old form do the saving, so every rule
 * (validation, owner-only) is the server's. Nothing is saved before "Ajouter".
 */
export function QuickAdd({ subjects, today }: { subjects: { id: string; name: string }[]; today: string }) {
  const [type, setType] = useState<QuickType | null>(null);
  const [a, setA] = useState<QuickAnswers>(empty);
  const [picked, setPicked] = useState<string | null>(null); // subject id, OTHER, or null
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const steps = stepsFor(type);
  const step = steps[stepIndex]!;
  const result = type ? buildQuickResult(a, today) : null;

  const ready: Record<Step, boolean> = {
    type: type !== null,
    subject: picked !== null && (picked !== OTHER || a.other !== null),
    day: true,
    time: a.hour !== null && a.minutes !== null,
    recap: result !== null,
  };

  function reset() {
    setType(null);
    setA(empty);
    setPicked(null);
    setStepIndex(0);
    setError(null);
  }

  function submit() {
    if (!result) return;
    setError(null);
    start(async () => {
      const res = result.kind === "exam" ? await addExam(result.input) : await addEvent(result.input);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      void celebrate({ particleCount: 40 });
      setDone(`${quickTitle(a)} · ${formatShortDate(resolveDay(a.day, today))}`);
      reset();
    });
  }

  if (done) {
    return (
      <div className="space-y-4 py-4" role="status">
        <p className="flex items-center justify-center gap-2 text-xl font-extrabold">
          <CalendarCheck className="size-6 text-revio-success-text" aria-hidden /> Ajouté à ton agenda !
        </p>
        <p className="text-muted-foreground">{done}</p>
        <ChunkyButton variant="secondary" onClick={() => setDone(null)}>
          Ajouter autre chose
        </ChunkyButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        role="progressbar"
        aria-label={`Étape ${stepIndex + 1} sur ${steps.length}`}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={stepIndex + 1}
        className="mx-auto h-3 max-w-md overflow-hidden rounded-pill bg-revio-primary-light"
      >
        <div
          className="h-full rounded-pill bg-revio-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${((stepIndex + 1) / Math.max(steps.length, 4)) * 100}%` }}
        />
      </div>

      {step === "type" && (
        <ChoiceGrid
          label={STEP_QUESTION.type}
          columns={3}
          value={type}
          onChange={(v) => {
            setType(v);
            setA((x) => ({ ...x, type: v, hour: null, minutes: null }));
          }}
          choices={QUICK_TYPES.map((v) => ({ value: v, ...QUICK_TYPE_LABELS[v] }))}
        />
      )}

      {step === "subject" && (
        <div className="space-y-6">
          <ChoiceGrid
            label={STEP_QUESTION.subject}
            description={
              subjects.length === 0 ? "Tu n'as pas encore de matière : choisis « Autre »." : undefined
            }
            columns={3}
            value={picked}
            onChange={(v) => {
              setPicked(v);
              const subject = subjects.find((s) => s.id === v) ?? null;
              setA((x) => ({ ...x, subject, other: v === OTHER ? x.other : null }));
            }}
            choices={[
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
              { value: OTHER, label: "Autre" },
            ]}
          />
          {picked === OTHER && (
            <ChoiceGrid
              label="Autre, c'est quoi ?"
              columns={3}
              value={a.other}
              onChange={(v) => setA((x) => ({ ...x, other: v }))}
              choices={OTHER_SUBJECTS.map((v) => ({ value: v, label: v }))}
            />
          )}
        </div>
      )}

      {step === "day" && (
        <ChoiceGrid
          label={STEP_QUESTION.day}
          columns={3}
          value={a.day}
          onChange={(v: DayChoice) => setA((x) => ({ ...x, day: v }))}
          choices={(Object.keys(DAY_LABELS) as DayChoice[]).map((v) => ({
            value: v,
            label: DAY_LABELS[v],
            hint: formatShortDate(resolveDay(v, today)),
          }))}
        />
      )}

      {step === "time" && (
        <div className="space-y-8">
          <ChoiceGrid
            label="À quelle heure ?"
            columns={4}
            value={a.hour === null ? null : String(a.hour)}
            onChange={(v) => setA((x) => ({ ...x, hour: Number(v) }))}
            choices={SLOT_HOURS.map((h) => ({ value: String(h), label: hourLabel(h) }))}
          />
          <ChoiceGrid
            label="Combien de temps ?"
            columns={3}
            value={a.minutes === null ? null : String(a.minutes)}
            onChange={(v) => setA((x) => ({ ...x, minutes: Number(v) }))}
            choices={DURATIONS.map((d) => ({ value: String(d.minutes), label: d.label }))}
          />
        </div>
      )}

      {step === "recap" && result && (
        <div className="space-y-4">
          <p className="text-xl font-extrabold">{STEP_QUESTION.recap}</p>
          <dl className="mx-auto grid max-w-md gap-2 rounded-2xl border bg-card p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Quoi</dt>
              <dd className="font-bold">{quickTitle(a)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quand</dt>
              <dd className="font-bold">
                {formatShortDate(resolveDay(a.day, today))}
                {result.kind === "event"
                  ? ` · ${result.input.startTime.replace(":", " h ")}`
                  : " · toute la journée"}
              </dd>
            </div>
            {result.kind === "event" && (
              <div>
                <dt className="text-muted-foreground">Jusqu&apos;à</dt>
                <dd className="font-bold">{result.input.endTime.replace(":", " h ")}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {step === "recap" ? (
          <ChunkyButton
            block
            className="mx-auto max-w-md"
            disabled={pending || !ready.recap}
            onClick={submit}
          >
            {pending ? "Ajout…" : "Ajouter"}
          </ChunkyButton>
        ) : (
          <ChunkyButton
            block
            className="mx-auto max-w-md"
            disabled={!ready[step]}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Continuer
          </ChunkyButton>
        )}
        {stepIndex > 0 && (
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={pending}
            onClick={() => setStepIndex((i) => i - 1)}
          >
            <ArrowLeft aria-hidden /> Retour
          </Button>
        )}
      </div>
    </div>
  );
}
