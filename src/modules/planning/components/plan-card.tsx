"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePlanAction } from "../server/actions";

/** Button that proposes (or re-proposes) revision sessions for the next 7 days. */
export function PlanCard({ hasRecommended }: { hasRecommended: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning de révision</CardTitle>
        <CardDescription>
          Revio propose des séances de 45 min sur les 7 prochains jours, selon tes matières prioritaires et
          ton temps libre (8 h–21 h, 3 h de révision par jour au plus). Convention Revio, pas une méthode
          officielle. Les séances que tu acceptes ou verrouilles ne sont jamais déplacées.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="min-h-11"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await generatePlanAction();
              if (res.ok) {
                setError(null);
                setMessage(
                  res.data.count === 0
                    ? "Aucune séance à proposer : pas de créneau libre ou aucune matière prioritaire."
                    : `${res.data.count} séance${res.data.count > 1 ? "s" : ""} proposée${res.data.count > 1 ? "s" : ""}.`,
                );
              } else {
                setMessage(null);
                setError(res.error.message);
              }
            })
          }
        >
          {hasRecommended ? "Replanifier les propositions" : "Proposer un planning"}
        </Button>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
