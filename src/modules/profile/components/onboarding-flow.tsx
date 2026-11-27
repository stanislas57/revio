"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { ChoiceGrid } from "@/components/revio/choice-grid";
import { ChunkyButton } from "@/components/revio/chunky-button";
import { RevioLogo } from "@/components/revio/logo";
import { Button } from "@/components/ui/button";
import {
  GENDER_LABELS,
  GENDERS,
  STUDY_LEVEL_LABELS,
  STUDY_LEVELS,
  type Gender,
  type StudyLevel,
} from "../domain/education";
import { ONBOARDING_SAVE_ERROR } from "../domain/onboarding";
import { saveOnboardingAnswers } from "../server/education-actions";
import { continueWithoutSaving } from "../server/onboarding-bypass";
import { skipOnboarding } from "../server/school-actions";
import { SchoolPicker } from "./school-picker";

const QUESTIONS = ["Où étudies-tu ?", "En quelle année es-tu ?", "Tu es…"] as const;

/**
 * The onboarding, right after the username (Duolingo-like): one question per screen, a progress bar, big choice
 * tiles and a big "Continuer". Every question is optional, so the main button is always clickable; "Plus tard"
 * (top of every screen) skips them all; nothing is saved before the end, then the app opens. If saving fails the
 * person is never stuck: a message and "Continuer sans enregistrer" open the app anyway. The answers stay
 * editable in Profil > Mes informations, and only the user sees them.
 */
export function OnboardingFlow({ email, username }: { email: string; username: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [studyLevel, setStudyLevel] = useState<StudyLevel | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const stepRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // The focus follows the question, so a screen reader reads the new screen.
  useEffect(() => {
    if (moved.current) stepRef.current?.focus();
  }, [step]);

  const last = step === QUESTIONS.length - 1;

  /** Runs a save; any failure (error result or a request that never reached the server) shows the way out. */
  function attempt(action: () => ReturnType<typeof skipOnboarding>) {
    setError(null);
    start(async () => {
      try {
        const res = await action();
        if (res.ok) router.refresh();
        else setError(ONBOARDING_SAVE_ERROR);
      } catch {
        setError(ONBOARDING_SAVE_ERROR);
      }
    });
  }

  function finish() {
    attempt(() => saveOnboardingAnswers({ schoolId, studyLevel, gender }));
  }

  function openAppWithoutSaving() {
    start(async () => {
      try {
        const res = await continueWithoutSaving();
        if (!res.ok) throw new Error(res.error.message);
        router.replace("/accueil");
        router.refresh();
      } catch {
        // The cookie could not be set (request lost): try the app anyway, the message stays reachable on failure.
        router.replace("/accueil");
      }
    });
  }

  function next() {
    if (last) return finish();
    moved.current = true;
    setStep((s) => s + 1);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-4 py-6 text-center">
      <h1 className="sr-only">Personnalise Revio</h1>
      <header className="flex items-center justify-between gap-3">
        <RevioLogo className="text-2xl" />
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={pending}
          onClick={() => attempt(skipOnboarding)}
        >
          Plus tard
        </Button>
      </header>

      <div className="space-y-2">
        <div
          role="progressbar"
          aria-label={`Question ${step + 1} sur ${QUESTIONS.length}`}
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={step + 1}
          className="h-4 overflow-hidden rounded-pill bg-revio-primary-light"
        >
          <div
            className="h-full rounded-pill bg-revio-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Bienvenue, {username} ! Question {step + 1} sur {QUESTIONS.length}, facultative.
        </p>
      </div>

      <div ref={stepRef} tabIndex={-1} aria-label={QUESTIONS[step]} className="flex-1 space-y-4 outline-none">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xl font-extrabold">{QUESTIONS[0]}</p>
            <p className="text-sm text-muted-foreground">
              Lycée, université ou école. Elle sert à personnaliser Revio, et toi seul la vois.
            </p>
            <SchoolPicker current={null} idPrefix="onboarding" onSelect={(s) => setSchoolId(s?.id ?? null)} />
          </div>
        )}
        {step === 1 && (
          <ChoiceGrid
            label={QUESTIONS[1]}
            description="Pour te proposer des matières qui te correspondent."
            columns={4}
            value={studyLevel}
            onChange={setStudyLevel}
            choices={STUDY_LEVELS.map((v) => ({ value: v, ...STUDY_LEVEL_LABELS[v] }))}
          />
        )}
        {step === 2 && (
          <ChoiceGrid
            label={QUESTIONS[2]}
            description="Facultatif, visible par toi seul. Ta réponse ne change rien à ce que Revio te montre."
            value={gender}
            onChange={setGender}
            choices={GENDERS.map((v) => ({ value: v, label: GENDER_LABELS[v] }))}
          />
        )}
      </div>

      {error && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={openAppWithoutSaving}
          >
            Continuer sans enregistrer
          </Button>
        </div>
      )}

      <footer className="space-y-3 border-t pt-6">
        <ChunkyButton block disabled={pending} onClick={next}>
          {pending ? "Enregistrement…" : last ? "Terminer" : "Continuer"}
        </ChunkyButton>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              disabled={pending}
              onClick={() => {
                moved.current = true;
                setStep((s) => s - 1);
              }}
            >
              <ArrowLeft aria-hidden /> Retour
            </Button>
          )}
        </div>
      </footer>

      <form action="/auth/deconnexion" method="post" className="flex flex-col items-center gap-1">
        <p className="text-xs text-muted-foreground">Connecté : {email}</p>
        <Button type="submit" variant="ghost" className="h-11">
          <LogOut className="size-4" aria-hidden /> Se déconnecter
        </Button>
      </form>
    </main>
  );
}
