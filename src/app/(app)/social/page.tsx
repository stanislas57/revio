import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { NotImplemented } from "@/components/states/not-implemented";

export const metadata: Metadata = { title: "Social" };

export default function SocialPage() {
  return (
    <>
      <PageHeader title="Social" description="Tes amis et le fil de leurs séances." />
      <div className="space-y-4">
        <NotImplemented
          owner="Charles"
          feature="Ajout d'amis, demandes d'amitié et fil automatique des séances terminées."
        />
        <EmptyState
          icon={Users}
          title="Pas encore d'amis"
          description="Le fil ne montrera que les séances que tes amis choisissent de partager. Jamais leurs notes."
        />
      </div>
    </>
  );
}
