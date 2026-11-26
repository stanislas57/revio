"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { skipOnboarding } from "../server/school-actions";
import { SchoolPicker } from "./school-picker";

/** Shown on the home screen until the user chose a school or pressed "Plus tard". Nothing blocks the app. */
export function FirstRunCard() {
  const [hidden, setHidden] = useState(false);
  const [pending, start] = useTransition();
  if (hidden) return null;
  return (
    <Card aria-labelledby="first-run-title">
      <CardHeader>
        <CardTitle id="first-run-title">Personnalise Revio</CardTitle>
        <CardDescription>
          Dis-nous où tu étudies : tu pourras ensuite importer ton relevé de notes ou ta fiche de matières
          pour préremplir ton tableau de bord. C&apos;est facultatif.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SchoolPicker current={null} idPrefix="first-run" onSaved={() => setHidden(true)} />
        <Button asChild variant="outline" className="h-11">
          <Link href="#importer">Importer un relevé de notes</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await skipOnboarding();
              if (res.ok) setHidden(true);
            })
          }
        >
          Plus tard
        </Button>
      </CardContent>
    </Card>
  );
}
