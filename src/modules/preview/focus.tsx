"use client";

import { useState } from "react";
import { BuddyBeam } from "@/components/revio/buddy-beam";
import { FocusTimer } from "@/components/revio/focus-timer";
import { PageHeader } from "@/components/layout/page-header";
import { DEMO_FOCUS } from "@/lib/mock/revio-demo";
import { PreviewBanner } from "./shared";

/** Mock-up of Focus with a buddy (Fusion-03-Focus). The real Focus screen is /focus. */
export function PreviewFocus() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <PageHeader title="Aperçu : focus à deux" description="Le vrai chronomètre est sur la page Focus." />
      <PreviewBanner>
        Le binôme et la série à deux n&apos;existent pas encore dans Revio ; le chronomètre ci-dessous est une
        simple maquette.
      </PreviewBanner>
      <div className="mx-auto max-w-sm space-y-4">
        <FocusTimer
          {...DEMO_FOCUS}
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          onFinish={() => setPaused(true)}
        />
        <BuddyBeam
          me={{ name: "Inès", initials: "IN" }}
          buddy={{ name: "Sarah", initials: "SA" }}
          days={9}
          status="Toi et Sarah révisez en même temps. 3 autres amis sont en focus en ce moment."
        />
      </div>
    </>
  );
}
