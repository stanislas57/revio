import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToNotes } from "@/modules/academic/components/back-to-notes";
import { DocumentImport } from "@/modules/academic/components/document-import";
import { SubjectForm } from "@/modules/academic/components/subject-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Importer ou ajouter une matière" };

export default async function ImportPage() {
  await requireUser();
  return (
    <div className="space-y-8">
      <div>
        <BackToNotes />
        <PageHeader
          title="Importer · ajouter"
          description="Un relevé ou une fiche de matières, ou une matière à la main."
        />
      </div>
      <DocumentImport />
      <Card id="ajouter-matiere" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Ajouter une matière</CardTitle>
          <CardDescription>Le coefficient sert à pondérer ta moyenne générale.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
