import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SessionSummary } from "@/modules/focus/components/session-summary";
import { getOwnSession } from "@/modules/focus/server/queries";
import { getMyGamification, getSessionXp } from "@/modules/gamification/server/queries";

export const metadata: Metadata = { title: "Séance terminée" };

export default async function SessionSummaryPage({ params }: PageProps<"/focus/seance/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await getOwnSession(id);
  if (!session) notFound();
  if (session.status === "in_progress") redirect("/focus");
  if (session.status === "abandoned") redirect("/focus");

  const [xp, stats] = await Promise.all([getSessionXp(id), getMyGamification()]);
  // "Level before" is only meaningful right after the session; we derive it from the ledger.
  const levelBeforeXp = stats.total_xp - xp.session - xp.streakBonus;
  return <SessionSummary session={session} xp={xp} totalXp={stats.total_xp} levelBeforeXp={levelBeforeXp} />;
}
