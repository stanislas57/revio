import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { NotImplemented } from "@/components/states/not-implemented";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" description="Examens et séances de révision planifiées." />
      <div className="space-y-4">
        <NotImplemented feature="Agenda, suivi des examens et génération du planning de révision. Hors périmètre de la démo du 30 novembre." />
        <EmptyState
          icon={CalendarDays}
          title="Rien de prévu"
          description="Tes examens et séances planifiées apparaîtront ici."
        />
      </div>
    </>
  );
}
