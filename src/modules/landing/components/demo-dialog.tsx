"use client";

import { ArrowLeft } from "lucide-react";
import { Dialog } from "radix-ui";
import { MockBadge } from "@/components/states/not-implemented";
import { Button } from "@/components/ui/button";
import { landingSerif } from "../fonts";
import type { DemoCardId } from "../demo-data";
import { DEMO_VIEWS } from "./demo-views";

/**
 * Full-screen demo of one card. Radix provides the dialog role, the focus trap, Escape to close and the
 * return of the focus to the card; the parent keeps the address hash in step (see OrbitStage).
 */
export default function DemoDialog({ id, onClose }: { id: DemoCardId; onClose: () => void }) {
  const { title, Body } = DEMO_VIEWS[id];
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          className={`demo-view landing-root ${landingSerif.variable} fixed inset-0 z-[100] overflow-y-auto outline-none`}
          aria-describedby="demo-description"
        >
          <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 px-4 py-6 sm:py-10">
            <div>
              <Button
                variant="ghost"
                className="-ml-3 min-h-11 gap-2 motion-reduce:transition-none"
                onClick={onClose}
              >
                <ArrowLeft aria-hidden /> Retour
              </Button>
            </div>
            <header className="space-y-2">
              <Dialog.Title className="landing-serif text-4xl sm:text-5xl">{title}</Dialog.Title>
              <Dialog.Description
                id="demo-description"
                className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              >
                <MockBadge /> Aperçu de démonstration avec des données inventées.
              </Dialog.Description>
            </header>
            <Body />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
