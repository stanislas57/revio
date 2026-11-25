import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SessionSummary } from "@/modules/focus/components/session-summary";
import { getSessionResult } from "@/modules/focus/server/queries";

export const metadata: Metadata = { title: "Séance terminée" };

export default async function SessionSummaryPage({ params }: PageProps<"/focus/seance/[id]">) {
  const { id } = await params;
  const found = await getSessionResult(id);
  if (found === null) notFound();
  if (found === "running") redirect("/focus");
  return <SessionSummary result={found.result} shared={found.shared} />;
}
