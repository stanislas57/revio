import type { Metadata } from "next";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { NotImplemented } from "@/components/states/not-implemented";

export const metadata: Metadata = { title: "Focus" };

export default function FocusPage() {
  return (
    <>
      <PageHeader title="Focus" description="Lance une séance de révision chronométrée et gagne de l'XP." />
      <div className="space-y-4">
        <NotImplemented
          owner="Charles"
          feature="Séance Focus (minuteur, fin de séance), gain d'XP et streak quotidienne."
        />
        <EmptyState
          icon={Timer}
          title="Aucune séance"
          description="Tes séances terminées apparaîtront ici."
        />
      </div>
    </>
  );
}
